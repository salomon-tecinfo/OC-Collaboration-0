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
orchardcollaboration.react.allComponents  = orchardcollaboration.react.allComponents  || {};

(function(){

var InfoPage = React.createClass({
	closeClickHandler: function(){
			this.props.root.actions.setAsyncState("normal")
	},
	render: function(){
		var root = this.props.root;

		switch(this.props.state){
			case "loading":
				return (<div className="info-page">{root.T("Loading", "Loading ...")}</div>)
			break;

			case "error":
				return (<div className="info-page">
						   <span className="error">{root.T("ErrotConnectingToServer", "Error in connecting to the server")}</span>
						   <a className="close-link" onClick={this.closeClickHandler}>{root.T("Close")}</a>
						</div>)
			break;			
		}

		return null;
	}
});
orchardcollaboration.react.allComponents.InfoPage = InfoPage;

var Display = React.createClass({
	render: function(){

		var shape = this.props.shape;
		var root = this.props.root;

		var containerTag = this.props.containerTag;

		containerTag = containerTag || "div";
		var notWrap = this.props.notWrap || false;

		// render nothing if there is no shape
		if (shape == null){
			return null;
		}

		var zoneTypes = ["Content", "ContentZone"];
		if (shape.Metadata && 
		    zoneTypes.indexOf(shape.Metadata.Type) < 0 &&
			typeof orchardcollaboration.react.allComponents[shape.Metadata.Type] !== "undefined"){
				return	React.createElement(orchardcollaboration.react.allComponents[shape.Metadata.Type] , {Model:shape.Model, root: root});
			};

		if (shape.Items && shape.Items.length > 0){
			var items = shape.Items.map(function(item){
				return React.render(Display({shape: item, root: root}));
			});
			
			return items.length == 1? items[0] : React.createElement(containerTag, null, items);
		}

		if (shape.Content && shape.Content.length > 0){
			shape.Content.sort(function(a,b){
				if (a.Metadata.Position > b.Metadata.Position){
					return 1;
				}
				else{
					return -1;
				}
			})
			
			var contentItems = shape.Content;
			if (notWrap){
				contentItems = [shape.Content[0]];
				shape.Content[0].NextSiblings = shape.Content.slice(1, shape.Content.length - 1);
			}

			var contentItemsComponents = contentItems.map(function(content){
				return React.createElement(Display, {shape: content, root: root});
			});
			
			return contentItemsComponents.length == 1? contentItemsComponents[0] :  React.createElement(containerTag, null, contentItemsComponents);
		}

		return null;
	}
});
orchardcollaboration.react.allComponents.Display = Display;

var Parts_Ticket_TableRow = React.createClass({
		menuClick: function(action, contentId){
			this.props.root.actions.ticketMenu(action, contentId)
		},

		componentDidMount: function(){
                var domNode = $(ReactDOM.findDOMNode(this));
				domNode.ProjectMenu({
					projectMenuCssClass: "milestone-item-menu"
				});

				domNode.on("mouseleave", function(){
					domNode.find(".milestone-item-menu").hide();
					domNode.find(".pivot").data("state", "off");
				})
		},

		render: function(){
		var _self = this;
		var mainProps = this.props;
		var root = mainProps.root;
		var ticketDisplayRoute = root.Routes.DisplayTicket;
		var url = decodeURI(ticketDisplayRoute);
		url = url.replace("{id}", mainProps.Model.TicketId);

		var menu = null;
		if (mainProps.Model.Menu && mainProps.Model.Menu.length > 0){
			var menuItems = mainProps.Model.Menu.map(function(menuItem){
			return <li onClick={_self.menuClick.bind(null, menuItem.Id, mainProps.Model.ContentItemId)}>{menuItem.Text}</li>
			});

			menu = <div className="milestone-item-menu-container">
					  <span className="pivot">
						  
                      </span>
					  <ul className="milestone-item-menu menu-hidden z2">
							{menuItems}
					  </ul>
				   </div>
		}
		else{
			menu = <span></span>
		}

		return (
		  <tr data-id={mainProps.Model.ContentItemId}>
			<td key="1" className="ticket-id-col"><a key="12" href={url}>{mainProps.Model.TicketNumber}</a></td>
			<td key="2" className="ticket-title-col"><a key="14" href={url}>{mainProps.Model.Title}</a></td>
			<td key="3" className="ticket-status-col">{mainProps.Model.StatusName}</td>
			<td key="4" className="ticket-menu-col">{menu}</td>
		 </tr>
			);
	}
});
orchardcollaboration.react.allComponents.Parts_Ticket_TableRow = Parts_Ticket_TableRow;

var Parts_Ticket_TitleOnly = React.createClass({
	render: function(){
		var root = this.props.root;
		var ticketDisplayRoute = root.Routes.DisplayTicket;
		var url = decodeURI(ticketDisplayRoute);
		url = url.replace("{id}", this.props.Model.TicketId);

		return(
		<div>
			<div class="ticket-list-id"><a href="{url}">{this.props.Model.TicketNumber}</a></div>
			<div class="ticket-list-name"><a href="{url}">{this.props.Model.Title}</a></div>
			<div class="clear"></div>
		</div>
		);
	}
});
orchardcollaboration.react.allComponents.Parts_Ticket_TitleOnly = Parts_Ticket_TitleOnly;

var Parts_Ticket_Pinboard = React.createClass({
	render: function(){
		var root = this.props.root;
		var ticketDisplayRoute = root.Routes.DisplayTicket;
		var url = decodeURI(ticketDisplayRoute);
		url = url.replace("{id}", this.props.Model.TicketId);
		return(
		<article data-canedit={this.props.Model.CurrentUserCanEditItem} className='ticket-pinboard' data-contentid={this.props.Model.ContentItemId}>
			<h4>
				<a href={url}>
					<span className="identity">#{this.props.Model.TicketNumber}</span>
					<span>{this.props.Model.Title}</span>
				</a>
			</h4>
			<div>
				<label className="label-container">{root.T("Priority")}:</label>
				<span className="ticket-service-value result">
					<span>{this.props.Model.PriorityName}</span>
				</span>
			</div>
			<div>
				<label className="label-container">{root.T("Type")}:</label>
				<span className="ticket-service-value result">
					<span>{this.props.Model.TypeName}</span>
				</span>
			</div>
		</article>
		);
	}
});
orchardcollaboration.react.allComponents.Parts_Ticket_Pinboard = Parts_Ticket_Pinboard;
var MilestonePlanner = React.createClass({
	render: function(){
		return (<div></div>);
	}
});

orchardcollaboration.react.allComponents.MilestonePlanner = MilestonePlanner;

var MilestoneTickets = React.createClass({
	filterKeyDown: function(event){
		if (event.keyCode == 13){
			this.filter();
		}
	},
	filter: function(){
        var domNode = $(ReactDOM.findDOMNode(this));
		var filterText = domNode.find(".filter-tickets").val();
		this.props.root.actions.filter(filterText);
	},
	render: function(){
	var _self = this;
	var itemsComponents = null;
	var mainContainer = null;
	var statusRecords = this.props.shape.Model.StatusRecords;

	var props = this.props;
	var root = props.root;
	var filterText = props.filterText;
	if (props.shape.Model.Items.length > 0){ 
	
		var latestRootTicketId = null;
		var altCssClass = "alt-row";
		itemsComponents = props.shape.Model.FilteredItems.map(function(item){
							var cells = [];

							if (item.InRoot){
								altCssClass = altCssClass  === "alt-row" ? "normal-row": "alt-row";
							}

							for(var i = 0; i < statusRecords.length; i++){
								var statusColumn = statusRecords[i];
								if ((item.StatusId == null && statusColumn.Id == 0) ||
									 item.StatusId == statusColumn.Id)
								{
									cells.push(<td data-status=''><Display root={props.root} shape={item}></Display></td>)
								}
								else{
									cells.push(<td data-contentid={item.ContentItem.Id} className='empty-td' data-status={statusColumn.Id}><div className='empty-cell'></div></td>)
								}
							}

							return(<tr key={item.ContentItem.Id} className={altCssClass}>{cells}</tr>)
						});
		var tableColumns = statusRecords.map(function(status){
			return (
					<th data-id='{status.Id}'>
						<span className="col-header">{status.Name}</span>
						<span title={root.T("NumberOfTickets", "Number of tickets")} className="count">{status.count}</span>
						<span title={root.T("SumSizeOfTickets", "Total size of tickets in this column")} className="size">{status.size}</span>
					</th>);
		});
		 
		mainContainer = <div key='milestoneTickets'>
						<div className='filter-box'>
							<input className='filter-tickets' onKeyDown={_self.filterKeyDown} defaultValue={filterText} type='text'/><input type='button' value={root.T("Filter")} onClick={_self.filter.bind(this)}/>
						</div>
						<div className="milestone-wild-card-container">
							<table className='milestone-items'>
								<thead>
									<tr>
										<th colSpan={tableColumns.length} className="milestone-tickets-header">
											<div >
												<span className='milestone-tickets-title'>{root.T("Tickets")}</span>
												<span className="milestone-size-label">{root.T("TotalSize", "Total Size:")}</span>
												<span className="milestone-size-value">{props.shape.Model.totalSize}</span>
											</div>						
										</th>
									</tr>
									<tr>{tableColumns}</tr>
								</thead>
								<tbody>
								{itemsComponents}							
								</tbody>
							</table>
						</div>
						</div>
		}
	else{
		mainContainer = <h6>There is no item in the Milestone</h6>;
	}	
		return (mainContainer);
	}
});

orchardcollaboration.react.allComponents.MilestoneTickets = MilestoneTickets;

var MilestonePlanner = React.createClass({
	render: function(){
		var milestoneMembers = null;
		var mainContainer = null;
		var props = this.props;
		var root = props.root;

		if (props.shape.Model.Items.length > 0){
			
			var milestoneMembersList = props.shape.Model.Items.map(function(item){
				return <Display root={root} notWrap="true" shape={item} ></Display>;
			});

			milestoneMembers = 	
							<div className="milestone-wild-card-container">
								<table className="milestone-items-list current-milestone">
									<thead>
										<tr>
											<th className="ticket-id-col">#</th>
											<th className="ticket-title-col">{root.T("Summary")}</th>
											<th className="ticket-status-col">{root.T("Status")}</th>
											<th className="ticket-menu-col"></th>
										</tr>
									</thead>
									<tbody>
										{milestoneMembersList}
									</tbody>
								</table>
							</div>
		}
		else{
			milestoneMembers =<div className="drop-target"><h5 className="milestone-no-item">{root.T("NoItemsInMilestone", "There is no item in the Milestone")}</h5></div>
		}

		var backLogComponent = null;
		if (props.shape.Model.BacklogMembers != null && props.shape.Model.BacklogMembers.length > 0){
			var backLogItems = props.shape.Model.BacklogMembers.map(function(item){
				return <Display root={root} notWrap="true" shape={item} key={item.ContentItem.Id} ></Display>;
				});
			backLogComponent = <div>
									<h4>{root.T("Backlog")}</h4>
									<table className="backlog milestone-items-list">
										<thead>
											<tr>
												<th className="ticket-id-col">#</th>
												<th className="ticket-title-col">{root.T("Summary")}</th>
												<th className="ticket-status-col">{root.T("Status")}</th>
												<th className="ticket-menu-col"></th>
											</tr>
										</thead>
										<tbody>
											{backLogItems}
										</tbody>
									</table>
							   </div>
		}
		else{
			backLogComponent =
				<div>
					<h4>{root.T("Backlog")}</h4>
					<div className="drop-target"><h5 className="milestone-no-item">{root.T("NoItemsInBacklog", "There is no item in the Backlog")}</h5></div>
				</div>
		}

		return <div>
					{milestoneMembers} 
					{backLogComponent}
			   </div>;
	}
 });
 orchardcollaboration.react.allComponents.MilestonePlanner = MilestonePlanner;

})();