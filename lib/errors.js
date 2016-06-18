'use strict';

const createError = require("create-error");

let HttpError = createError("HttpError");

let httpErrorTypes = {
	400: "BadRequestError",
	401: "UnauthorizedError",
	403: "ForbiddenError",
	404: "NotFoundError",
	405: "MethodNotAllowedError",
	409: "ConflictError",
	422: "ValidationError" // Actually, "Unprocessable entity".
}

/* Fields that may be sent to the user in a JSON response. */
let publicFields = {
	422: ["errors"],
	401: ["ipFailures", "ipBlocked", "needsCaptcha", "userFailures", "userBlocked"]
}

let errors = {
	CaptchaError: createError("CaptchaError")
	// Additional error types go here
}

Object.keys(httpErrorTypes).forEach((code) => {
	let errorName = httpErrorTypes[code];
	let errorProperties = {
		statusCode: parseInt(code)
	};
	
	if (publicFields[code] != null) {
		errorProperties.publicFields = publicFields[code];
	}
	
	errors[errorName] = createError(HttpError, errorName, errorProperties);
});

module.exports = errors;