// export function foo(obj) {
// 	obj && obj.foo
// }

// export function bar(obj) {
// 	obj && obj.bar
// }

let handleError = null;
var utils = {
	foo(fn) {
		callWithErrorHandling(fn);
	},
	registerErrorHandler(fn) {
		handleError = fn;
	}
};

function callWithErrorHandling(fn) {
	try {
		fn && fn();
	} catch (err) {
		handleError(err);
	}
}

// import { foo } from './utils'

utils.registerErrorHandler(e => {
	console.log('打印***e======> 报错了', e);
});

utils.foo(() => {
	console.log('打印***1======>', a);
});
