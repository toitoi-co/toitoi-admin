'use strict';

module.exports = function({environment}) {	
	return function(err, req, res, next) {
		if (environment === "development") {
			console.log(err);
			console.log(err.stack);
		}

		if (err.statusCode != null && typeof err.statusCode === "number") {
			res.status(err.statusCode);

			/* We only want to send the message for client errors - for any other errors, it likely contains internal information. */
			if ((err.statusCode >= 400 && err.statusCode < 500) || environment === "development") {
				let errorResponse = {
					message: err.message
				};

				if (err.publicFields != null) {
					err.publicFields.forEach((field) => {
						errorResponse[field] = err[field];
					})
				}

				res.send(errorResponse);
			} else {
				res.send({
					message: http.STATUS_CODES[err.statusCode]
				});
			}
		} else {
			if (environment === "development") {
				res.status(500).send({
					message: err.message
				});
			} else {
				res.status(500).send({
					message: "An unknown error occurred."
				});
			} 
			
		}
	}
}