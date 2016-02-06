'use strict';

module.exports = function(err, req, res, next) {
	console.log(err);
	console.log(err.stack); // FIXME: Only in development
	
	if (err.statusCode != null && typeof err.statusCode === "number") {
		res.status(err.statusCode);
		
		/* We only want to send the message for client errors - for any other errors, it likely contains internal information. */
		if (err.statusCode >= 400 && err.statusCode < 500) {
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
		res.status(500).send({
			message: "An unknown error occurred."
		});
	}
}