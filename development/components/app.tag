app
	response-viewer
	
	.authentication-status
		strong Authentication status: 
			span.authenticated(show="{authStatus === true}") Authenticated ({profile.email})
			span.unauthenticated(show="{authStatus === false}") Unauthenticated
			span.unknown(show="{authStatus == null}") ...
	
	tab-list(tabs="{tabs}")
	
	tab(tabName="register", title="Register")
		json-form(route="/register", method="POST")
			div.field
				label E-mail address:
				input(type="text", name="email")
				
			div.field
				label Password:
				input(type="password", name="password")
				
			div.field
				label First name:
				input(type="text", name="firstName")
				
			div.field
				label Last name:
				input(type="text", name="lastName")
	
	tab(tabName="login", title="Login")
		json-form(route="/login", method="POST")
			div.field
				label E-mail address:
				input(type="text", name="email")
				
			div.field
				label Password:
				input(type="password", name="password")
	
	tab(tabName="change-password", title="Change password")
		json-form(route="/change-password", method="POST")
			div.field
				label Old password:
				input(type="text", name="oldPassword")
				
			div.field
				label New password:
				input(type="password", name="password")
	
	tab(tabName="confirm-email", title="Confirm e-mail address")
		json-form(route="/confirm/:confirmationKey", method="POST", use-form-params="true")
			div.field
				label Confirmation key:
				input(type="text", name="confirmationKey")
			
	tab(tabName="token", title="Generate Firebase token")
		json-form(route="/generate-token", method="POST")
			
	tab(tabName="stripe", title="Store Stripe token")
		form#stripe-form(onsubmit="{parent.generateStripe}")
			div.field
				label Card Number:
				input(type="text", data-stripe="number")
			div.field
				label Expiration:
				input(type="text", size=2, data-stripe="exp_month")
				input(type="text", size=2, data-stripe="exp_year")
			div.field
				label CVC:
				input(type="text", data-stripe="cvc")
			div.field
				button(type="submit") Retrieve token
	
		json-form(route="/stripe-token", method="POST")
			div.field
				label Token:
				input#stripe-token(type="text", name="token")
	
	tab(tabName="logout", title="Log out")
		json-form(route="/logout", method="POST")
	
	tab(tabName="presets", title="List presets")
		json-form(route="/presets", method="GET")
	
	tab(tabName="profile-get", title="Get current user")
		json-form(route="/profile", method="GET")
	
	tab(tabName="profile-set", title="Modify current user")
		// TODO: Only display fields that the user is allowed to change
		object-editor(show="{profile != null}", object="{profile}", route="/profile")
		
	tab(tabName="site-get", title="Get current site")
		json-form(route="/site", method="GET")
	
	tab(tabName="site-set", title="Modify current site")
		// TODO: Only display fields that the user is allowed to change
		object-editor(show="{site != null}", object="{site}", route="/site")
		
		json-form(show="{site == null}", route="/site", method="PUT")
			div.field(each="{field in parent.parent.formFields.userSite}")
				hr(if="{field.type === 'divider'}")
				virtual(if="{field.type !== 'divider'}")
					label {field.description}:
					input(type="text", name="{field.name}", value="{field.default}")
		
	tab(tabName="signed-request-preset", title="Signed request: Switch preset")
		json-form(route="/generate-signed-request/preset", method="POST")
			div.field
				label Hostname:
				input(type="text", name="hostname")
				
			div.field
				label Preset ID:
				input(type="text", name="presetId")
				
	tab(tabName="admin-roles", title="List roles")
		json-form(route="/admin/roles", method="GET")
	
	
	virtual(each="{model in ['users', 'presets', 'sites', 'plans']}")
		tab(tabName="admin-{model}-list", title="List {model}")
			json-form(route="/admin/{model}", method="GET")
			
		tab(tabName="admin-{model}-create", title="Create {model}")
			json-form(route="/admin/{model}", method="POST")
				div.field(each="{field in parent.parent.formFields[model]}")
					hr(if="{field.type === 'divider'}")
					virtual(if="{field.type !== 'divider'}")
						// TODO: parent.parent?
						label {field.description}:
						input(type="text", name="{field.name}", value="{field.default}")
			
		tab(tabName="admin-{model}-modify", title="Lookup/modify {model}")
			object-lookup(route="/admin/{model}/:id")
		
	style(type="scss").
		tab {
			display: none;
		}
		
		.authentication-status {
			margin: 12px 0px;
			font-weight: bold;
			
			.authenticated {
				color: green;
			}
			
			.unauthenticated {
				color: red;
			}
			
			.unknown {
				color: gray;
			}
		}
		
		.field {
			margin: 4px 0px;
		
			label {
				display: inline-block;
				width: 250px;
			}
		}
		
	script.
		const Promise = require("bluebird");
		const riotQuery = require("riot-query");
		
		const hide = require("../lib/dom/hide");
		const show = require("../lib/dom/show");
		const errors = require("../lib/util/errors");
		const rejectErrors = require("../lib/http/reject-errors");
		
		Object.assign(this, {
			authStatus: null,
			profile: null,
			
			tabs: require("../lib/config/tabs"),
			formFields: require("../lib/config/create-form-fields"),
			
			loadProfile: function() {
				return Promise.try(() => {
					return window.fetch("/profile", {
						credentials: "include"
					});
				}).then((response) => {
					this.checkAuthenticated(response);
					return rejectErrors(response);
				}).then((response) => {
					return response.json();
				}).then((profile) => {
					this.update({
						profile: profile
					});
				}).catch(errors.HttpError, (err) => {
					// ignore...
				})
			},
			loadSite: function() {
				return Promise.try(() => {
					return window.fetch("/site", {
						credentials: "include"
					});
				}).then((response) => {
					this.checkAuthenticated(response);
					return rejectErrors(response);
				}).then((response) => {
					return response.json();
				}).then((site) => {
					this.update({
						site: site
					});
				}).catch(errors.HttpError, (err) => {
					// ignore...
				})
			},
			checkAuthenticated: function(response) {
				if (response.headers.get("X-API-Authenticated") === "true") {
					this.update({
						authStatus: true
					});

					if (this.profile == null) {
						this.loadProfile();
					}
				} else {
					this.update({
						authStatus: false
					});
				}
			},
			generateStripe: (event) => {
				let responseViewer = this.tags["response-viewer"];
				
				Stripe.card.createToken(document.querySelector("#stripe-form"), (status, response) => {
					if (status === 200) {
						responseViewer.done(response);
						document.querySelector("#stripe-token").value = response.id;
					} else {
						responseViewer.error(response);
					}
				});

				event.preventDefault();
			}
		});
		
		this.on("mount", () => {
			let responseViewer = this.tags["response-viewer"];
			let tabList = this.tags["tab-list"];
			
			this.update({
				currentTab: "admin-plans-modify"
			});
			
			tabList.on("switchTab", (tabName) => {
				this.currentTab = tabName;
				this.update();
			});
			
			riotQuery(this, "**/tab/{json-form,object-lookup,object-editor}").forEach((formTag) => {
				formTag.on("pending", () => {
					responseViewer.pending();
				});
				
				formTag.on("response", (response) => {
					Promise.try(() => {
						this.checkAuthenticated(response);
						return rejectErrors(response);
					}).then((response) => {
						if (response.status === 204) {
							return "";
						} else {
							return response.json();
						}
					}).then((json) => {
						responseViewer.done(json);
					}).catch(errors.HttpError, (err) => {
						responseViewer.error(err.json);
					});
				});
				
				formTag.on("error", (err) => {
					responseViewer.error(err.json);
				});
			});
			
			this.loadProfile();
			this.loadSite();
		});
		
		this.on("update", () => {
			Array.from(this.root.querySelectorAll("tab")).forEach((element) => {
				hide(element);
			});
			
			let tabElement = this.root.querySelector(`tab[tabName='${this.currentTab}']`);
			
			if (tabElement != null) {
				show(tabElement);
			}
		});