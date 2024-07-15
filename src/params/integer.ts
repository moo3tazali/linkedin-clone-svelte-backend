// route matcher
export function match(param) {
	return /^-?\d+$/.test(param);
}

// route matcher is for to check if a param is an integer
// if we have a dynamic route, we need to check if the param is an integer
// the folder of the dynamic route into routes folder should be for example
// [productId=integer]
// Now if we visit http://localhost:3000/product/123, the match will return true
// and the param will be 123
// if we visit http://localhost:3000/product/abc, the match will return false
// and we will get an 404 error page
