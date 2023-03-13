// export function foo(obj) {
// 	obj && obj.foo
// }

// export function bar(obj) {
// 	obj && obj.bar
// }

let handleError = null
export default {
	foo(fn) {
		callWithErrorHandling(fn)
	},
	registerErrorHandler(fn) {
		handleError = fn
	}
}

function callWithErrorHandling(fn) {
	try {
		fn && fn()
	} catch (err) {
		handleError(err)
	}
}
