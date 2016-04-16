response-viewer
	h1
		| Response 
		span.pending(show="{status === 'pending'}") pending...
		span.error(show="{status === 'error'}") ERROR
		
	pre.response {response}
		
	style(scoped, type="scss").
		.response {
			background-color: silver;
			padding: 16px;
		}

		.error {
			color: red;
		}

		.pending {
			color: silver;
		}
		
	script.
		function formatResponse(response) {
			return JSON.stringify(response, null, 4);
		}
		
		Object.assign(this, {
			status: "none",
			response: "",
			
			pending: function() {
				this.update({
					status: "pending",
					response: "..."
				});
			},
			done: function(response) {
				this.update({
					status: "done",
					response: formatResponse(response)
				})
			},
			error: function(response) {
				this.update({
					status: "error",
					response: formatResponse(response)
				})
			}
		});