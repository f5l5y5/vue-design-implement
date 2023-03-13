// import { foo } from './utils'

// /*#__PURE__*/ foo({ foo: 1 })

import utils from './utils'

utils.registerErrorHandler(e => {
	console.log('打印***e======> 报错了', e)
})

utils.foo(() => {
	console.log('打印***1======>', a)
})
