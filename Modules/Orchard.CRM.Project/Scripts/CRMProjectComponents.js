/// Orchard Collaboration is a series of plugins for Orchard CMS that provides an integrated ticketing system and collaboration framework on top of it.
/// Copyright (C) 2014-2016  Siyamand Ayubi
///
/// This file is part of Orchard Collaboration.
///
///    Orchard Collaboration is free software: you can redistribute it and/or modify
///    it under the terms of the GNU General Public License as published by
///    the Free Software Foundation, either version 3 of the License, or
///    (at your option) any later version.
///
///    Orchard Collaboration is distributed in the hope that it will be useful,
///    but WITHOUT ANY WARRANTY; without even the implied warranty of
///    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
///    GNU General Public License for more details.
///
///    You should have received a copy of the GNU General Public License
///    along with Orchard Collaboration.  If not, see <http://www.gnu.org/licenses/>.

var orchardcollaboration = orchardcollaboration || {};
orchardcollaboration.react = orchardcollaboration.react || {};
orchardcollaboration.react.allComponents = orchardcollaboration.react.allComponents || {};

(function () {

	var InfoPage = React.createClass({
		displayName: "InfoPage",

		closeClickHandler: function () {
			this.props.root.actions.setAsyncState("normal");
		},
		render: function () {
			var root = this.props.root;

			switch (this.props.state) {
				case "loading":
					return React.createElement(
						"div",
						{ className: "info-page" },
						root.T("Loading", "Loading ...")
					);
					break;

				case "error":
					return React.createElement(
						"div",
						{ className: "info-page" },
						React.createElement(
							"span",
							{ className: "error" },
							root.T("ErrotConnectingToServer", "Error in connecting to the server")
						),
						React.createElement(
							"a",
							{ className: "close-link", onClick: this.closeClickHandler },
							root.T("Close")
						)
					);
					break;
			}

			return null;
		}
	});
	orchardcollaboration.react.allComponents.InfoPage = InfoPage;

	var Display = React.createClass({
		displayName: "Display",

		render: function () {

			var shape = this.props.shape;
			var root = this.props.root;

			var containerTag = this.props.containerTag;

			containerTag = containerTag || "div";
			var notWrap = this.props.notWrap || false;

			// render nothing if there is no shape
			if (shape == null) {
				return null;
			}

			var zoneTypes = ["Content", "ContentZone"];
			if (shape.Metadata && zoneTypes.indexOf(shape.Metadata.Type) < 0 && typeof orchardcollaboration.react.allComponents[shape.Metadata.Type] !== "undefined") {
				return React.createElement(orchardcollaboration.react.allComponents[shape.Metadata.Type], { Model: shape.Model, root: root });
			};

			if (shape.Items && shape.Items.length > 0) {
				var items = shape.Items.map(function (item) {
					return React.render(Display({ shape: item, root: root }));
				});

				return items.length == 1 ? items[0] : React.createElement(containerTag, null, items);
			}

			if (shape.Content && shape.Content.length > 0) {
				shape.Content.sort(function (a, b) {
					if (a.Metadata.Position > b.Metadata.Position) {
						return 1;
					} else {
						return -1;
					}
				});

				var contentItems = shape.Content;
				if (notWrap) {
					contentItems = [shape.Content[0]];
					shape.Content[0].NextSiblings = shape.Content.slice(1, shape.Content.length - 1);
				}

				var contentItemsComponents = contentItems.map(function (content) {
					return React.createElement(Display, { shape: content, root: root });
				});

				return contentItemsComponents.length == 1 ? contentItemsComponents[0] : React.createElement(containerTag, null, contentItemsComponents);
			}

			return null;
		}
	});
	orchardcollaboration.react.allComponents.Display = Display;

	var Parts_Ticket_TableRow = React.createClass({
		displayName: "Parts_Ticket_TableRow",

		menuClick: function (action, contentId) {
			this.props.root.actions.ticketMenu(action, contentId);
		},

		componentDidMount: function () {
			var domNode = $(ReactDOM.findDOMNode(this));
			domNode.ProjectMenu({
				projectMenuCssClass: "milestone-item-menu"
			});

			domNode.on("mouseleave", function () {
				domNode.find(".milestone-item-menu").hide();
				domNode.find(".pivot").data("state", "off");
			});
		},

		render: function () {
			var _self = this;
			var mainProps = this.props;
			var root = mainProps.root;
			var ticketDisplayRoute = root.Routes.DisplayTicket;
			var url = decodeURI(ticketDisplayRoute);
			url = url.replace("{id}", mainProps.Model.TicketId);

			var menu = null;
			if (mainProps.Model.Menu && mainProps.Model.Menu.length > 0) {
				var menuItems = mainProps.Model.Menu.map(function (menuItem) {
					return React.createElement(
						"li",
						{ onClick: _self.menuClick.bind(null, menuItem.Id, mainProps.Model.ContentItemId) },
						menuItem.Text
					);
				});

				menu = React.createElement(
					"div",
					{ className: "milestone-item-menu-container" },
					React.createElement("span", { className: "pivot" }),
					React.createElement(
						"ul",
						{ className: "milestone-item-menu menu-hidden z2" },
						menuItems
					)
				);
			} else {
				menu = React.createElement("span", null);
			}

			return React.createElement(
				"tr",
				{ "data-id": mainProps.Model.ContentItemId },
				React.createElement(
					"td",
					{ key: "1", className: "ticket-id-col" },
					React.createElement(
						"a",
						{ key: "12", href: url },
						mainProps.Model.TicketNumber
					)
				),
				React.createElement(
					"td",
					{ key: "2", className: "ticket-title-col" },
					React.createElement(
						"a",
						{ key: "14", href: url },
						mainProps.Model.Title
					)
				),
				React.createElement(
					"td",
					{ key: "3", className: "ticket-status-col" },
					mainProps.Model.StatusName
				),
				React.createElement(
					"td",
					{ key: "4", className: "ticket-menu-col" },
					menu
				)
			);
		}
	});
	orchardcollaboration.react.allComponents.Parts_Ticket_TableRow = Parts_Ticket_TableRow;

	var Parts_Ticket_TitleOnly = React.createClass({
		displayName: "Parts_Ticket_TitleOnly",

		render: function () {
			var root = this.props.root;
			var ticketDisplayRoute = root.Routes.DisplayTicket;
			var url = decodeURI(ticketDisplayRoute);
			url = url.replace("{id}", this.props.Model.TicketId);

			return React.createElement(
				"div",
				null,
				React.createElement(
					"div",
					{ "class": "ticket-list-id" },
					React.createElement(
						"a",
						{ href: "{url}" },
						this.props.Model.TicketNumber
					)
				),
				React.createElement(
					"div",
					{ "class": "ticket-list-name" },
					React.createElement(
						"a",
						{ href: "{url}" },
						this.props.Model.Title
					)
				),
				React.createElement("div", { "class": "clear" })
			);
		}
	});
	orchardcollaboration.react.allComponents.Parts_Ticket_TitleOnly = Parts_Ticket_TitleOnly;

	var Parts_Ticket_Pinboard = React.createClass({
		displayName: "Parts_Ticket_Pinboard",

		render: function () {
			var root = this.props.root;
			var ticketDisplayRoute = root.Routes.DisplayTicket;
			var url = decodeURI(ticketDisplayRoute);
			url = url.replace("{id}", this.props.Model.TicketId);
			return React.createElement(
				"article",
				{ "data-canedit": this.props.Model.CurrentUserCanEditItem, className: "ticket-pinboard", "data-contentid": this.props.Model.ContentItemId },
				React.createElement(
					"h4",
					null,
					React.createElement(
						"a",
						{ href: url },
						React.createElement(
							"span",
							{ className: "identity" },
							"#",
							this.props.Model.TicketNumber
						),
						React.createElement(
							"span",
							null,
							this.props.Model.Title
						)
					)
				),
				React.createElement(
					"div",
					null,
					React.createElement(
						"label",
						{ className: "label-container" },
						root.T("Priority"),
						":"
					),
					React.createElement(
						"span",
						{ className: "ticket-service-value result" },
						React.createElement(
							"span",
							null,
							this.props.Model.PriorityName
						)
					)
				),
				React.createElement(
					"div",
					null,
					React.createElement(
						"label",
						{ className: "label-container" },
						root.T("Type"),
						":"
					),
					React.createElement(
						"span",
						{ className: "ticket-service-value result" },
						React.createElement(
							"span",
							null,
							this.props.Model.TypeName
						)
					)
				)
			);
		}
	});
	orchardcollaboration.react.allComponents.Parts_Ticket_Pinboard = Parts_Ticket_Pinboard;
	var MilestonePlanner = React.createClass({
		displayName: "MilestonePlanner",

		render: function () {
			return React.createElement("div", null);
		}
	});

	orchardcollaboration.react.allComponents.MilestonePlanner = MilestonePlanner;

	var MilestoneTickets = React.createClass({
		displayName: "MilestoneTickets",

		filterKeyDown: function (event) {
			if (event.keyCode == 13) {
				this.filter();
			}
		},
		filter: function () {
			var domNode = $(ReactDOM.findDOMNode(this));
			var filterText = domNode.find(".filter-tickets").val();
			this.props.root.actions.filter(filterText);
		},
		render: function () {
			var _self = this;
			var itemsComponents = null;
			var mainContainer = null;
			var statusRecords = this.props.shape.Model.StatusRecords;

			var props = this.props;
			var root = props.root;
			var filterText = props.filterText;
			if (props.shape.Model.Items.length > 0) {

				var latestRootTicketId = null;
				var altCssClass = "alt-row";
				itemsComponents = props.shape.Model.FilteredItems.map(function (item) {
					var cells = [];

					if (item.InRoot) {
						altCssClass = altCssClass === "alt-row" ? "normal-row" : "alt-row";
					}

					for (var i = 0; i < statusRecords.length; i++) {
						var statusColumn = statusRecords[i];
						if (item.StatusId == null && statusColumn.Id == 0 || item.StatusId == statusColumn.Id) {
							cells.push(React.createElement(
								"td",
								{ "data-status": "" },
								React.createElement(Display, { root: props.root, shape: item })
							));
						} else {
							cells.push(React.createElement(
								"td",
								{ "data-contentid": item.ContentItem.Id, className: "empty-td", "data-status": statusColumn.Id },
								React.createElement("div", { className: "empty-cell" })
							));
						}
					}

					return React.createElement(
						"tr",
						{ key: item.ContentItem.Id, className: altCssClass },
						cells
					);
				});
				var tableColumns = statusRecords.map(function (status) {
					return React.createElement(
						"th",
						{ "data-id": "{status.Id}" },
						React.createElement(
							"span",
							{ className: "col-header" },
							status.Name
						),
						React.createElement(
							"span",
							{ title: root.T("NumberOfTickets", "Number of tickets"), className: "count" },
							status.count
						),
						React.createElement(
							"span",
							{ title: root.T("SumSizeOfTickets", "Total size of tickets in this column"), className: "size" },
							status.size
						)
					);
				});

				mainContainer = React.createElement(
					"div",
					{ key: "milestoneTickets" },
					React.createElement(
						"div",
						{ className: "filter-box" },
						React.createElement("input", { className: "filter-tickets", onKeyDown: _self.filterKeyDown, defaultValue: filterText, type: "text" }),
						React.createElement("input", { type: "button", value: root.T("Filter"), onClick: _self.filter.bind(this) })
					),
					React.createElement(
						"div",
						{ className: "milestone-wild-card-container" },
						React.createElement(
							"table",
							{ className: "milestone-items" },
							React.createElement(
								"thead",
								null,
								React.createElement(
									"tr",
									null,
									React.createElement(
										"th",
										{ colSpan: tableColumns.length, className: "milestone-tickets-header" },
										React.createElement(
											"div",
											null,
											React.createElement(
												"span",
												{ className: "milestone-tickets-title" },
												root.T("Tickets")
											),
											React.createElement(
												"span",
												{ className: "milestone-size-label" },
												root.T("TotalSize", "Total Size:")
											),
											React.createElement(
												"span",
												{ className: "milestone-size-value" },
												props.shape.Model.totalSize
											)
										)
									)
								),
								React.createElement(
									"tr",
									null,
									tableColumns
								)
							),
							React.createElement(
								"tbody",
								null,
								itemsComponents
							)
						)
					)
				);
			} else {
				mainContainer = React.createElement(
					"h6",
					null,
					"There is no item in the Milestone"
				);
			}
			return mainContainer;
		}
	});

	orchardcollaboration.react.allComponents.MilestoneTickets = MilestoneTickets;

	var MilestonePlanner = React.createClass({
		displayName: "MilestonePlanner",

		render: function () {
			var milestoneMembers = null;
			var mainContainer = null;
			var props = this.props;
			var root = props.root;

			if (props.shape.Model.Items.length > 0) {

				var milestoneMembersList = props.shape.Model.Items.map(function (item) {
					return React.createElement(Display, { root: root, notWrap: "true", shape: item });
				});

				milestoneMembers = React.createElement(
					"div",
					{ className: "milestone-wild-card-container" },
					React.createElement(
						"table",
						{ className: "milestone-items-list current-milestone" },
						React.createElement(
							"thead",
							null,
							React.createElement(
								"tr",
								null,
								React.createElement(
									"th",
									{ className: "ticket-id-col" },
									"#"
								),
								React.createElement(
									"th",
									{ className: "ticket-title-col" },
									root.T("Summary")
								),
								React.createElement(
									"th",
									{ className: "ticket-status-col" },
									root.T("Status")
								),
								React.createElement("th", { className: "ticket-menu-col" })
							)
						),
						React.createElement(
							"tbody",
							null,
							milestoneMembersList
						)
					)
				);
			} else {
				milestoneMembers = React.createElement(
					"div",
					{ className: "drop-target" },
					React.createElement(
						"h5",
						{ className: "milestone-no-item" },
						root.T("NoItemsInMilestone", "There is no item in the Milestone")
					)
				);
			}

			var backLogComponent = null;
			if (props.shape.Model.BacklogMembers != null && props.shape.Model.BacklogMembers.length > 0) {
				var backLogItems = props.shape.Model.BacklogMembers.map(function (item) {
					return React.createElement(Display, { root: root, notWrap: "true", shape: item, key: item.ContentItem.Id });
				});
				backLogComponent = React.createElement(
					"div",
					null,
					React.createElement(
						"h4",
						null,
						root.T("Backlog")
					),
					React.createElement(
						"table",
						{ className: "backlog milestone-items-list" },
						React.createElement(
							"thead",
							null,
							React.createElement(
								"tr",
								null,
								React.createElement(
									"th",
									{ className: "ticket-id-col" },
									"#"
								),
								React.createElement(
									"th",
									{ className: "ticket-title-col" },
									root.T("Summary")
								),
								React.createElement(
									"th",
									{ className: "ticket-status-col" },
									root.T("Status")
								),
								React.createElement("th", { className: "ticket-menu-col" })
							)
						),
						React.createElement(
							"tbody",
							null,
							backLogItems
						)
					)
				);
			} else {
				backLogComponent = React.createElement(
					"div",
					null,
					React.createElement(
						"h4",
						null,
						root.T("Backlog")
					),
					React.createElement(
						"div",
						{ className: "drop-target" },
						React.createElement(
							"h5",
							{ className: "milestone-no-item" },
							root.T("NoItemsInBacklog", "There is no item in the Backlog")
						)
					)
				);
			}

			return React.createElement(
				"div",
				null,
				milestoneMembers,
				backLogComponent
			);
		}
	});
	orchardcollaboration.react.allComponents.MilestonePlanner = MilestonePlanner;
})();