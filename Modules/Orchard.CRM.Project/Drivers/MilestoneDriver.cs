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

using Newtonsoft.Json.Linq;
using Orchard.ContentManagement;
using Orchard.ContentManagement.Drivers;
using Orchard.CRM.Core.Models;
using Orchard.CRM.Core.Services;
using Orchard.CRM.Core.ViewModels;
using Orchard.CRM.Project.Models;
using Orchard.CRM.Project.Services;
using Orchard.CRM.Project.ViewModels;
using Orchard.Localization;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Web;

namespace Orchard.CRM.Project.Drivers
{
    public class MilestoneDriver : MenuBaseDriver<MilestonePart>
    {
        private readonly IMilestoneService milestoneService;
        private readonly IBasicDataService basicDataService;

        public MilestoneDriver(
            IBasicDataService basicDataService,
            IMilestoneService milestoneService,
            IExtendedProjectService projectService,
            IHelperService helperService,
            IFolderService folderService,
            ICRMContentOwnershipService contentOwnershipService,
            IOrchardServices services)
            : base(contentOwnershipService, projectService, services, helperService, folderService)
        {
            this.basicDataService = basicDataService;
            this.milestoneService = milestoneService;
        }

        protected override DriverResult Display(MilestonePart part, string displayType, dynamic shapeHelper)
        {
            if (displayType == "Detail")
            {
                return this.DetailDisplay(part, shapeHelper);
            }
            else if (displayType == "Planner")
            {
                return this.PlannerDisplay(part, shapeHelper);
            }
            else
            {
                EditMilestoneViewModel model = this.Convert(part);
                return this.ContentShape("Parts_Milestone_Data", () => shapeHelper.Parts_Milestone_Data(Model: model));
            }
        }

        protected DriverResult PlannerDisplay(MilestonePart part, dynamic shapeHelper)
        {
            List<DriverResult> shapes = new List<DriverResult>();

            EditMilestoneViewModel model = this.Convert(part);
            shapes.Add(ContentShape("Parts_Milestone_Data", () => shapeHelper.Parts_Milestone_Data(Model: model)));

            var memberShapes = this.GetMilestoneMembers(part.Id, "TableRow").ToList();

            // in the planner, we don't need the child tickets. Only root items or the ones whose
            // parents are not part of the milestone
            memberShapes = memberShapes.Where(c =>
                c.ParentId == default(int) ||
                (c.ParentId != default(int) && !memberShapes.Any(d => d.ContentItem.Id == c.ParentId))).ToList();

            var attachToProjectPart = part.As<AttachToProjectPart>();
            if (attachToProjectPart == null || attachToProjectPart.Record.Project == null)
            {
                throw new OrchardException(T("Milestone is not attached to a project"));
            }

            int projectId = attachToProjectPart.Record.Project.Id;
            var project = this.services.ContentManager.Get(projectId);

            if (project == null)
            {
                throw new OrchardException(T("Milestone is not attached to a project"));
            }

            dynamic membersModel = new ExpandoObject();
            membersModel.Part = part;
            membersModel.CanEdit = this.contentOwnershipService.CurrentUserCanEditContent(part.ContentItem);
            membersModel.Items = memberShapes;
            membersModel.ProjectId = projectId;
            membersModel.MilestoneId = part.Id;
            membersModel.BacklogId = null;

            if (!part.IsBacklog)
            {
                var backlog = this.milestoneService.GerProjectBacklog(projectId);

                if (backlog == null)
                {
                    throw new OrchardException(T("Project doesn't have any Backlog"));
                }

                var backlogShapes = this.GetMilestoneMembers(backlog.Id, "TableRow").ToList();
                membersModel.BacklogMembers = backlogShapes;
                membersModel.BacklogId = backlog.Id;
            }

            shapes.Add(ContentShape("Parts_Milestone_Planner", () => shapeHelper.Parts_Milestone_Planner(Model: membersModel)));

            return this.Combined(shapes.ToArray());
        }

        protected DriverResult DetailDisplay(MilestonePart part, dynamic shapeHelper)
        {
            List<DriverResult> shapes = new List<DriverResult>();

            EditMilestoneViewModel model = this.Convert(part);
            shapes.Add(ContentShape("Parts_Milestone_Data", () => shapeHelper.Parts_Milestone_Data(Model: model)));

            var memberShapes = this.GetMilestoneMembers(part.Id, "Pinboard").ToList();

            memberShapes.ForEach(c =>
            {
                ContentItem contentItem = c.ContentItem;
                TicketPart ticket = contentItem.As<TicketPart>();
                c.StatusId = ticket.Record.StatusRecord != null ? (int?)ticket.Record.StatusRecord.Id : null;
            });

            dynamic ticketsModel = new ExpandoObject();
            ticketsModel.Part = part;
            ticketsModel.Items = memberShapes;

            // we want to represent the tickets in a table where there is a column for each status.
            var statusRecords = this.basicDataService.GetStatusRecords().ToList();
            statusRecords.Insert(0, new StatusRecord { Id = 0, OrderId = 0, Name = T("No Status").Text });
            ticketsModel.StatusRecords = statusRecords;

            shapes.Add(ContentShape("Parts_Milestone_Tickets", () => shapeHelper.Parts_Milestone_Tickets(Model: ticketsModel)));

            return this.Combined(shapes.ToArray());
        }

        protected IEnumerable<dynamic> GetMilestoneMembers(int milestoneId, string displayType)
        {
            var members = this.milestoneService.GetMilestoneItems(milestoneId);

            // sort items based on order
            members = members.OrderBy(c => c.As<AttachToMilestonePart>().Record.OrderId).ThenByDescending(c => c.Id).ToList();

            List<dynamic> memberShapes = new List<dynamic>();
            foreach (var item in members)
            {
                dynamic shape = this.services.ContentManager.BuildDisplay(item, displayType);

                // set ParentId to the shape, it simplifies sorting
                var ticketPart = item.As<TicketPart>();
                shape.ParentId = ticketPart != null && ticketPart.Record.Parent != null ?
                    ticketPart.Record.Parent.Id : default(int);
                memberShapes.Add(shape);
            }

            // we want to sort the items in such a way that childs of a tickets appears under it
            List<dynamic> output = new List<dynamic>();

            // Contains root tickets (the ones who have no parent or the parent is not part of the milestone
            var currentLevel = memberShapes.Where(c => 
                c.ParentId == default(int) ||
                (c.ParentId != default(int) && !memberShapes.Any(d=>d.ContentItem.Id == c.ParentId))).ToList();
            currentLevel.ForEach(c => c.InRoot = true);
            output.AddRange(currentLevel);

            while (currentLevel.Count > 0)
            {
                List<dynamic> newLevel = new List<dynamic>();

                foreach(var item in currentLevel)
                {
                    int index = output.IndexOf(item);
                    
                    // find children
                    var childs = memberShapes.Where(c => c.ParentId == item.ContentItem.Id);

                    foreach (var child in childs)
                    {
                        output.Insert(index + 1, child);
                        newLevel.Add(child);
                        index++;
                    }
                }

                currentLevel = newLevel;
            }

            return output;
        }

        protected EditMilestoneViewModel Convert(MilestonePart part)
        {
            EditMilestoneViewModel model = new EditMilestoneViewModel
            {
                IsBacklog = part.Record.IsBacklog,
                Start = part.Record.StartTime,
                End = part.Record.EndTime,
                IsClosed = part.Record.IsClosed,
                IsCurrent = part.Record.IsCurrent
            };

            return model;
        }

        protected override DriverResult Editor(MilestonePart part, IUpdateModel updater, dynamic shapeHelper)
        {
            EditMilestoneViewModel model = new EditMilestoneViewModel();
            updater.TryUpdateModel(model, Prefix, null, null);

            part.Record.IsCurrent = model.IsCurrent;
            part.Record.IsClosed = model.IsClosed;
            part.Record.StartTime = model.Start;
            part.Record.EndTime = model.End;

            return null;
        }

        protected override DriverResult Editor(MilestonePart part, dynamic shapeHelper)
        {
            EditMilestoneViewModel model = this.Convert(part);

            return ContentShape("Parts_Milestone_Edit",
                   () => shapeHelper.EditorTemplate(
                       TemplateName: "Parts/Milestone",
                       Model: model,
                       Prefix: Prefix));
        }
    }
}