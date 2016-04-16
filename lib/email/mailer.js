'use strict';

const Promise = require("bluebird");
const nunjucks = Promise.promisifyAll(require("nunjucks"));
const nodemailer = require("nodemailer");
const mailgunTransport = require("nodemailer-mailgun-transport");

module.exports = function(options) {
	let mailer = Promise.promisifyAll(nodemailer.createTransport(mailgunTransport({
		auth: {
			api_key: options.apiKey,
			domain: options.domain
		}
	})));

	return {
		send: function(template, recipient, subject, locals) {
			return Promise.try(() => {
				return nunjucks.renderAsync(path.join(options.templatePath, template), locals);
			}).then((html) => {
				return mailer.sendMailAsync({
					from: options.sender,
					to: recipient,
					subject: subject,
					html: html
				});
			});
		}
	}
}