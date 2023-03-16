const bucket = new WeakMap()
// const obj = new Proxy(data, {
// 	get(target, key) {
// 		track(target, key)
// 		return target[key]
// 	},
// 	set(target, key, newVal) {
// 		target[key] = newVal
// 		trigger(target, key)
// 	}
// })

function track(target, key) {
	if (!activeEffect) return
	let depsMap = bucket.get(target)
	if (!depsMap) {
		bucket.set(target, (depsMap = new Map()))
	}
	let deps = depsMap.get(key)
	if (!deps) {
		depsMap.set(key, (deps = new Set()))
	}
	deps.add(activeEffect)
	// deps 就是一个与当前副作用函数存在联系的依赖集合
	// 将其添加到 activeEffect.deps 数组中
	activeEffect.deps.push(deps)
}

function trigger(target, key) {
	const depsMap = bucket.get(target)
	if (!depsMap) return
	const effects = depsMap.get(key)
	const effectsToRun = new Set()
	effects &&
		effects.forEach(effectFn => {
			// 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
			if (effectFn !== activeEffect) {
				effectsToRun.add(effectFn)
			}
		})
	effectsToRun.forEach(effectFn => {
		// 如果一个副作用函数存在调度器，则调用该调度器，并将副作用函数作为参数传递
		if (effectFn.options.scheduler) {
			effectFn.options.scheduler(effectFn)
		} else {
			effectFn()
		}
	}) // 新增
}

let activeEffect
const effectStack = []

function effect(fn, options = {}) {
	const effectFn = () => {
		cleanup(effectFn) // 调用 cleanup 函数完成清除工作
		activeEffect = effectFn //当 effectFn 执行时，将其设置为当前激活的副作用函数
		effectStack.push(effectFn)
		const res = fn()
		effectStack.pop()
		activeEffect = effectStack[effectStack.length - 1]
		return res
	}
	// 将 options 挂载到 effectFn 上
	effectFn.options = options
	effectFn.deps = [] //存储所有包含当前副作用函数的依赖集合
	if (!options.lazy) {
		// 执行副作用函数
		effectFn()
	}
	// 将副作用函数作为返回值返回
	return effectFn
}

function cleanup(effectFn) {
	for (let i = 0; i < effectFn.deps.length; i++) {
		const deps = effectFn.deps[i]
		deps.delete(effectFn)
	}
	effectFn.deps.length = 0
}

const jobQueue = new Set()
const p = Promise.resolve()
let isFlushing = false
function flushJob() {
	if (isFlushing) return
	isFlushing = true
	p.then(() => {
		jobQueue.forEach(job => job())
	}).finally(() => {
		isFlushing = false
	})
}

function watch(source, cb, options = {}) {
	let getter
	if (typeof source === 'function') {
		getter = source
	} else {
		getter = () => traverse(source)
	}
	let oldValue, newVal

	let cleanup
	function onInvalidate(fn) {
		cleanup = fn
	}

	// 提取 scheduler 调度函数为一个独立的 job 函数
	const job = () => {
		newVal = effectFn()
		// 在调用回调函数 cb 之前，先调用过期回调
		if (cleanup) {
			cleanup()
		}
		cb(newVal, oldValue, onInvalidate)
		oldValue = newVal
	}

	const effectFn = effect(
		// 调用 traverse 递归地读取
		() => getter(),
		{
			lazy: true,
			scheduler: () => {
				// 在调度函数中判断 flush 是否为 'post'，如果是，将其放到微任务队列中执行
				if (options.flush === 'post') {
					const p = Promise.resolve()
					p.then(job)
				} else {
					job()
				}
			}
		}
	)
	if (options.immediate) {
		job()
	} else {
		// 手动调用副作用函数，拿到的值就是旧值
		oldValue = effectFn()
	}
}

function traverse(value, seen = new Set()) {
	// 如果要读取的数据是原始值，或者已经被读取过了，那么什么都不做
	if (typeof value !== 'object' || value === null || seen.has(value)) return
	// 将数据添加到 seen 中，代表遍历地读取过了，避免循环引用引起的死循环
	seen.add(value)
	// 暂时不考虑数组等其他结构
	// 假设 value 就是一个对象，使用 for...in 读取对象的每一个值，并递归地调用 traverse 进行处理
	for (const k in value) {
		traverse(value[k], seen)
	}
	return value
}

function proxy(data) {
	return new Proxy(data, {
		get(target, key) {
			track(target, key)
			return target[key]
		},
		set(target, key, newVal) {
			target[key] = newVal
			trigger(target, key)
		}
	})
}

export { effect, proxy }
