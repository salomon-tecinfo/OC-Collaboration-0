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

using Orchard.ContentManagement.Handlers;
using Orchard.CRM.Core.Models;
using Orchard.CRM.Project.Models;
using Orchard.CRM.Project.Services;
using Orchard.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Orchard.ContentManagement;
using Orchard.Core.Common.Models;
using Orchard.ContentManagement.FieldStorage.InfosetStorage;
using Orchard.Core.Containers.Models;
using Orchard.Core.Navigation.Services;
using Orchard.Core.Navigation.Models;

namespace Orchard.CRM.Project.Handlers
{
    public class ProjectHandler : ContentHandler
    {
        public ProjectHandler(
            IContentManager contentManager,
            IMenuService menuService,
            IRepository<ProjectPartRecord> repository,
            IExtendedProjectService projectService)
        {
            OnCreated<ProjectPart>((context, projectPart) =>
            {
                projectService.CreateProjectDependencies(projectPart);
            });

            OnRemoved<ProjectPart>((context, projectPart) =>
            {
                // Delete menu and menu widget
                var menu = menuService.GetMenu(projectPart.MenuId);
                if (menu != null)
                {
                    menuService.Delete(menu.As<MenuPart>());

                    var projectMenuWidget = projectService.GetProjectMenuWidget(projectPart.Id);
                    if (projectMenuWidget != null)
                    {
                        contentManager.Remove(projectMenuWidget);
                    }
                }
            });

            OnPublished<ProjectPart>((context, projectPart) =>
            {
                ProjectDashboardEditorPart dashboardPart = projectPart.As<ProjectDashboardEditorPart>();
                int[] portletIds = dashboardPart.PortletList ?? new int[] { };
                ContentItem projectDetail = contentManager
                    .Query()
                    .ForType(ContentTypes.ProjectDetailContentType)
                    .Where<AttachToProjectPartRecord>(c => c.Project.Id == projectPart.Id)
                    .Slice(1)
                    .FirstOrDefault();

                if (projectDetail == null)
                {
                    return;
                }

                // portlets
                var currentPortlets = contentManager.Query().Where<CommonPartRecord>(c => c.Container.Id == projectDetail.Id).List();

                var portletTemplates = contentManager.GetMany<ContentItem>(portletIds, VersionOptions.Published, new QueryHints());

                // add new portlets
                int position = -1;
                foreach (var portletId in portletIds)
                {
                    position++;
                    var currentPortlet = currentPortlets.FirstOrDefault(c => c.As<InfosetPart>().Retrieve<int>(FieldNames.ProjectDashboardPortletTemplateId) == portletId);
                    if (currentPortlet != null)
                    {
                        ContainablePart containablePart = currentPortlet.As<ContainablePart>();
                        containablePart.Position = position;
                        continue;
                    }

                    var portletTemplate = portletTemplates.FirstOrDefault(c => c.Id == portletId);

                    if (portletTemplate == null)
                    {
                        continue;
                    }

                    projectService.AddPortlet(projectDetail, portletTemplate, position);
                }

                // delete existing portlets that are not exist in the portletIds
                foreach (var portlet in currentPortlets)
                {
                    var templateId = portlet.As<InfosetPart>().Retrieve<int>(FieldNames.ProjectDashboardPortletTemplateId);

                    if (!portletIds.Contains(templateId))
                    {
                        contentManager.Remove(portlet);
                    }
                }
            });
        }

        protected override void GetItemMetadata(GetContentItemMetadataContext context)
        {
            base.GetItemMetadata(context);

            if (context.ContentItem.ContentType == ContentTypes.ProjectDetailContentType)
            {
                context.Metadata.DisplayText = "Project Detail";

                AttachToProjectPart attachToProjectPart = context.ContentItem.As<AttachToProjectPart>();
                if (attachToProjectPart.Record.Project != null)
                {
                    context.Metadata.DisplayText += " " + attachToProjectPart.Record.Project.Title;
                }
            }
        }
    }
}