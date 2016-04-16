tab-list
	section(each="{section in opts.tabs}")
		.category(each="{category in section.categories}")
			| ({section.name}) 
			span.categoryName {category.name}
			button(each="{item in category.items}", onclick="{_switchTab}", tab-name="{item.tabName}") {item.name}
		hr
		
	style(type="scss").
		.categoryName {
			font-weight: bold;
			margin-right: 8px;
		}
		
		button.active {
			color: blue;
			font-weight: bold;
		}
		
	script.
		Object.assign(this, {
			_switchTab: (event) => {
				let tabName = event.item.item.tabName;
				
				Array.from(this.root.querySelectorAll("button")).forEach((button) => {
					button.classList.remove("active");
				});
				
				this.root.querySelector(`button[tab-name="${tabName}"]`).classList.add("active");
				
				this.trigger("switchTab", tabName);
			}
		})