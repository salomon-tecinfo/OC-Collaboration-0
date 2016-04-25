﻿/// Orchard Collaboration is a series of plugins for Orchard CMS that provides an integrated ticketing system and collaboration framework on top of it.
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

using Orchard.ContentManagement;
using Orchard.ContentManagement.FieldStorage.InfosetStorage;
using Orchard.ContentManagement.MetaData;
using Orchard.Core.Common.Models;
using Orchard.Core.Containers.Models;
using Orchard.Core.Navigation.Models;
using Orchard.Core.Navigation.Services;
using Orchard.Core.Title.Models;
using Orchard.CRM.Core.Models;
using Orchard.CRM.Core.Providers.Filters;
using Orchard.CRM.Core.Services;
using Orchard.CRM.Project.Models;
using Orchard.Data;
using Orchard.Fields.Fields;
using Orchard.Localization;
using Orchard.Projections.Models;
using Orchard.Reporting.Models;
using Orchard.Settings;
using Orchard.UI.Navigation;
using Orchard.Utility;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Globalization;
using System.Linq;
using System.Web.Mvc;

namespace Orchard.CRM.Project.Services
{
    public class ExtendedProjectService : ProjectService, IExtendedProjectService
    {
        private readonly ICRMContentOwnershipService crmContentOwnershipService;
        private readonly ISiteService siteService;
        private readonly IRepository<LayoutRecord> layoutRepository;
        private readonly IMenuService menuService;
        private readonly IRepository<ReportRecord> reportRepository;
        private readonly UrlHelper urlHelper;

        public ExtendedProjectService(
            IContentDefinitionManager contentDefinitionManager,
            INavigationManager navigationManager,
            IRepository<ReportRecord> reportRepository,
            IMenuService menuService,
            IRepository<LayoutRecord> layoutRepository,
            ISiteService siteService,
            IOrchardServices services,
            ICRMContentOwnershipService crmContentOwnershipService,
            IProjectionManagerWithDynamicSort projectionManagerWithDynamicSort,
            UrlHelper urlHelper)
            : base(contentDefinitionManager, navigationManager, menuService, siteService, services, crmContentOwnershipService, projectionManagerWithDynamicSort)
        {
            this.urlHelper = urlHelper;
            this.layoutRepository = layoutRepository;
            this.reportRepository = reportRepository;
            this.menuService = menuService;
            this.siteService = siteService;
            this.crmContentOwnershipService = crmContentOwnershipService;
        }

        // TODO: Use caching
        public ContentItem GetProjectWiki(int projectId)
        {
            var contentManager = this.services.ContentManager;
            Action<IAliasFactory> alias = x => x.ContentPartRecord<AttachToProjectPartRecord>();
            var query = contentManager.HqlQuery().ForVersion(VersionOptions.Published).ForType(ContentTypes.WikiContentType).Where(alias, c => c.Eq("Project.Id", projectId));
            var result = query.Slice(0, 1);

            return result.FirstOrDefault();
        }

        // TODO: use caching
        public ContentItem GetProjectActivityStream(int projectId)
        {
            var contentManager = this.services.ContentManager;
            Action<IAliasFactory> alias = x => x.ContentPartRecord<AttachToProjectPartRecord>();
            var query = contentManager.HqlQuery().ForVersion(VersionOptions.Published).ForType(ContentTypes.ProjectActivityStreamType).Where(alias, c => c.Eq("Project.Id", projectId));
            var result = query.Slice(0, 1);

            return result.FirstOrDefault();
        }

        // TODO: use caching
        public ContentItem GetProjectRelatedItem(string contentType, int projectId)
        {
            var contentManager = this.services.ContentManager;
            Action<IAliasFactory> alias = x => x.ContentPartRecord<AttachToProjectPartRecord>();
            var query = contentManager.HqlQuery().ForVersion(VersionOptions.Published).ForType(contentType).Where(alias, c => c.Eq("Project.Id", projectId));
            var result = query.Slice(0, 1);

            return result.FirstOrDefault();
        }

        // TODO: use caching
        public Dictionary<int, List<ProjectPart>> GetUsersProjects(IEnumerable<int> users)
        {
            var query = this.services.ContentManager.HqlQuery().ForVersion(VersionOptions.Published).ForType("ProjectItem");

            dynamic permissionsState = new ExpandoObject();
            permissionsState.AccessType = null;
            permissionsState.Teams = null;
            permissionsState.BusinessUnits = null;
            permissionsState.Users = users.ToList();

            query = this.projectionManagerWithDynamicSort.ApplyFilter(query, ContentItemPermissionFilter.CategoryName, ContentItemPermissionFilter.AnySelectedUserTeamBusinessUnit, permissionsState);

            var contentItems = query.Slice(0, 0);

            Dictionary<int, List<ProjectPart>> returnValue = new Dictionary<int, List<ProjectPart>>();

            foreach (var user in users)
            {
                List<ProjectPart> projects = new List<ProjectPart>();
                foreach (var contentItem in contentItems)
                {
                    var contentOwnershipPart = contentItem.As<ContentItemPermissionPart>();
                    var projectPart = contentItem.As<ProjectPart>();

                    if (contentOwnershipPart != null &&
                        contentOwnershipPart.Record.Items != null &&
                        contentOwnershipPart.Record.Items.Any(c => c.User != null && c.User.Id == user))
                    {
                        projects.Add(projectPart);
                    }
                }

                returnValue[user] = projects;
            }

            return returnValue;
        }

        public ContentItem GetProjectMenuWidget(int projectId)
        {
            // update project Menu Title
            return this
                .services
                .ContentManager
                .HqlQuery()
                .ForType(ContentTypes.ProjectMenuContentType)
                .Where(c => c.ContentPartRecord<AttachToProjectPartRecord>(), c => c.Eq("Project.Id", projectId))
                .Slice(0, 1)
                .FirstOrDefault();
        }

        public ContentItem CreateProjectMenu(ProjectPart project)
        {
            // create menu
            var menu = this.menuService.Create(string.Format("Project-{0} --'{1}'", project.Id.ToString(CultureInfo.InvariantCulture), project.Record.Title));
            project.MenuId = menu.Id;

            var contentManger = this.services.ContentManager;
            ContentItem menuContentItem = contentManger.Create(ContentTypes.ProjectMenuContentType);

            // update AttachToProjectPart
            AttachToProjectPart attachToProjectPart = menuContentItem.As<AttachToProjectPart>();
            attachToProjectPart.Record.Project = project.Record;

            // update MenuWidgetPart
            MenuWidgetPart menuWidgetPart = menuContentItem.As<MenuWidgetPart>();
            menuWidgetPart.AddHomePage = false;
            menuWidgetPart.Breadcrumb = false;
            menuWidgetPart.MenuContentItemId = menu.Id;

            // create menu items
            Action<string, LocalizedString> createMenu = (url, localizedText) =>
            {
                var menuItemPart = contentManger.Create<MenuItemPart>("MenuItem");
                menuItemPart.Url = url;

                var menuPart = menuItemPart.As<MenuPart>();
                menuPart.MenuPosition = Position.GetNext(this.navigationManager.BuildMenu(menu));
                menuPart.MenuText = localizedText.Text;
                menuPart.Menu = menu;

                contentManger.Publish(menuItemPart.ContentItem);
            };

            Action<ContentItem, string> createProjectSubPartListUrl = (contentItem, title) =>
            {
                var url = this.urlHelper.Action("Display", "Item", new { id = contentItem.Id, area = "Orchard.CRM.Core" });
                createMenu(url, T(title));
            };

            var targetContentItems = contentManger.HqlQuery().ForType(new[]
            {
                ContentTypes.WikiContentType, 
                ContentTypes.ProjectTicketsContentType, 
                ContentTypes.ProjectDiscussionsContentType, 
                ContentTypes.ProjectActivityStreamType,
                ContentTypes.ProjectProjectionContentType
            }).Where(c => c.ContentPartRecord<AttachToProjectPartRecord>(), d => d.Eq("Project.Id", project.Id)).List();

            foreach (var contentItem in targetContentItems)
            {
                string title = string.Empty;
                if (contentItem.ContentType == ContentTypes.WikiContentType)
                {
                    title = "Wiki";
                }
                else
                {
                    TitlePart titlePart = contentItem.As<TitlePart>();
                    title = titlePart.Title;
                }

                createProjectSubPartListUrl(contentItem, title);
            }

            // Create link to backlog
            var backLogItem = contentManger
                .HqlQuery()
                .ForType(ContentTypes.MilestoneContentType)
                .Where(c => c.ContentPartRecord<AttachToProjectPartRecord>(), d => d.Eq("Project.Id", project.Id))
                .List()
                .FirstOrDefault(c => c.As<MilestonePart>().IsBacklog);

            if (backLogItem != null)
            {
                createProjectSubPartListUrl(backLogItem, T("Backlog").Text);
            }


            // edit project
            var editUrl = this.urlHelper.Action("Edit", "Project", new { id = project.Id, area = "Orchard.CRM.Project" });
            createMenu(editUrl, T("Edit"));

            // Project People
            var peopleUrl = this.urlHelper.Action("Edit", "ProjectItemsOwnership", new { ids = project.Id, area = "Orchard.CRM.Project" });
            createMenu(peopleUrl, T("People"));

            this.services.ContentManager.Publish(menuContentItem);

            return menuContentItem;
        }

        public QueryPart GetProjectActivityStreamQueryPart()
        {
            return this.GetQuery(QueryNames.ProjectActivityStreamQueryName);
        }

        public void AddPortlet(ContentItem projectDashboard, ContentItem portletTemplate, int position)
        {
            ContentItem newPortlet = null;
            if (portletTemplate.ContentType == ContentTypes.ProjectDashboardProjectionPortletTemplateContentType)
            {
                newPortlet = this.services.ContentManager.Create(ContentTypes.ProjectDashboardProjectionPortletContentType);
                ProjectionWithDynamicSortPart destinationProjectionPart = newPortlet.As<ProjectionWithDynamicSortPart>();
                ProjectionWithDynamicSortPart sourceProjectionPart = portletTemplate.As<ProjectionWithDynamicSortPart>();
                this.Copy(sourceProjectionPart.Record, destinationProjectionPart.Record);
            }
            else if (portletTemplate.ContentType == ContentTypes.ProjectDashboardReportViewerPortletTemplateContentType)
            {
                newPortlet = this.services.ContentManager.Create(ContentTypes.ProjectDashboardReportViewerPortletContentType);
                DataReportViewerPart destinationReportViewerPart = newPortlet.As<DataReportViewerPart>();
                DataReportViewerPart sourceReportViewerPart = portletTemplate.As<DataReportViewerPart>();
                this.Copy(sourceReportViewerPart.Record, destinationReportViewerPart.Record);
            }
            else if (portletTemplate.ContentType == ContentTypes.ProjectLastActivityStreamTemplateContentType)
            {
                newPortlet = this.services.ContentManager.Create(ContentTypes.ProjectLastActivityStreamContentType);
                var sourceActivityStreamPart = portletTemplate.As<ActivityStreamPart>();
                var destinationActivityStreamPart = newPortlet.As<ActivityStreamPart>();
                destinationActivityStreamPart.QueryId = sourceActivityStreamPart.QueryId;
            }
            else
            {
                throw new ArgumentOutOfRangeException("The ContentType of the portletTemplate is not supported.");
            }

            // store templateId
            newPortlet.As<InfosetPart>().Store<int>(FieldNames.ProjectDashboardPortletTemplateId, portletTemplate.Id);

            // copy Title
            TitlePart titlePart = newPortlet.As<TitlePart>();
            TitlePart templateTitlePart = portletTemplate.As<TitlePart>();
            titlePart.Title = templateTitlePart.Title;

            ContainablePart containablePart = newPortlet.As<ContainablePart>();
            containablePart.Position = position;

            var projectDetailContainerPart = projectDashboard.As<ContainerPart>();
            var newPortletCommon = newPortlet.As<CommonPart>();
            newPortletCommon.Container = projectDashboard;
            this.services.ContentManager.Publish(newPortlet);
        }

        public void CreateProjectDependencies(ProjectPart project)
        {
            var contentManager = this.services.ContentManager;

            // Create project tickets
            this.CreateProjectionForProjectAttachableItems(project, ContentTypes.ProjectTicketsContentType, QueryNames.ProjectTicketsQueryName, "Tickets", ContentTypes.TicketContentType);

            // Create project discussions
            this.CreateProjectionForProjectAttachableItems(project, ContentTypes.ProjectProjectionContentType, QueryNames.ProjectDiscussionsQueryName, "Discussions", ContentTypes.DiscussionContentType);

            // create project milestones
            this.CreateProjectionForProjectAttachableItems(project, ContentTypes.ProjectProjectionContentType, QueryNames.ProjectMilestonesQueryName, "Milestones", ContentTypes.MilestoneContentType);

            // Create wiki 
            var wiki = this.CreateAttachableItemToProject(project, ContentTypes.WikiContentType);
            var wikiActivityStreamPart = wiki.As<ActivityStreamPart>();
            var wikiActivityStreamQuery = this.GetQuery(QueryNames.WikiActivityStreamQueryName);
            if (wikiActivityStreamQuery != null)
            {
                wikiActivityStreamPart.QueryId = wikiActivityStreamQuery.Record.Id;
            }

            contentManager.Publish(wiki);

            // Create wiki Root
            var wikiRoot = this.CreateAttachableItemToProject(project, ContentTypes.RootWikiContentType);
            contentManager.Publish(wikiRoot);

            // Create project detail
            var projectDetail = this.CreateAttachableItemToProject(project, ContentTypes.ProjectDetailContentType);
            project.Record.Detail = projectDetail.Record;
            var projectDetailContainerPart = projectDetail.As<ContainerPart>();
            projectDetailContainerPart.Record.AdminListViewName = "DefaultListView";

            // prevent original ContainerPart to render items
            projectDetailContainerPart.Record.ItemsShown = false;
            contentManager.Publish(projectDetail);

            // Create project activityStream
            var projectActivityStream = this.CreateAttachableItemToProject(project, ContentTypes.ProjectActivityStreamType);
            projectActivityStream.As<TitlePart>().Title = "Activity Stream";
            var activityStreamPart = projectActivityStream.As<ActivityStreamPart>();
            var activityStreamQuery = this.GetProjectActivityStreamQueryPart();
            if (activityStreamQuery != null)
            {
                activityStreamPart.QueryId = activityStreamQuery.Record.Id;
            }
            contentManager.Publish(projectActivityStream);

            // create project back-log
            var backLogContentItem = this.CreateAttachableItemToProject(project, ContentTypes.MilestoneContentType);
            MilestonePart milestone = backLogContentItem.As<MilestonePart>();
            milestone.IsBacklog = true;
            TitlePart milestoneTitlePart = backLogContentItem.As<TitlePart>();
            milestoneTitlePart.Title = T("Backlog").Text;
            contentManager.Publish(backLogContentItem);

            this.CreateProjectMenu(project);
        }

        private ContentItem CreateAttachableItemToProject(ProjectPart project, string contentType)
        {
            var contentManager = this.services.ContentManager;

            var contentItem = contentManager.New(contentType);
            contentManager.Create(contentItem);
            var attachToProjectPart = contentItem.As<AttachToProjectPart>();
            attachToProjectPart.Record.Project = project.Record;

            return contentItem;
        }

        private ContentItem CreateProjectionForProjectAttachableItems(ProjectPart project, string contentType, string queryName, string title, string itemContentType)
        {
            // get query
            var query = this.GetQuery(queryName);
            if (query != null)
            {
                var contentItem = this.CreateAttachableItemToProject(project, contentType);

                // projection
                var projection = contentItem.As<ProjectionWithDynamicSortPart>();
                projection.Record.QueryPartRecord = query.Record;
                projection.Record.ItemsPerPage = 20;

                // layout
                var layout = this.layoutRepository.Table.FirstOrDefault(c => c.QueryPartRecord.Id == query.Id && c.Category == "Html" && c.Type == "Shape");
                if (layout != null)
                {
                    projection.Record.LayoutRecord = layout;
                }

                // Title
                TitlePart titlePart = contentItem.As<TitlePart>();
                titlePart.Title = title;

                // item type
                var projectProjectionPart = contentItem.Parts.FirstOrDefault(c => c.PartDefinition.Name == ContentTypes.ProjectProjectionContentType);
                if (projectProjectionPart != null)
                {
                    var field = projectProjectionPart.Fields.FirstOrDefault(c => c.Name == FieldNames.ProjectProjectionItemTypeFieldName);
                    if (field != null)
                    {
                        ((InputField)field).Value = itemContentType;
                    }

                    var displayField = projectProjectionPart.Fields.FirstOrDefault(c => c.Name == FieldNames.ProjectProjectionItemTypeDisplayFieldName);
                    if (displayField != null)
                    {
                        var contentTypeDefinition = this.services.ContentManager.GetContentTypeDefinitions().FirstOrDefault(c => c.Name == itemContentType);
                        ((InputField)displayField).Value = contentTypeDefinition.DisplayName;
                    }
                }

                this.services.ContentManager.Publish(contentItem);

                return contentItem;
            }

            return null;
        }

        private void Copy(ProjectionPartRecord source, ProjectionPartRecord destination)
        {
            destination.Items = source.Items;
            destination.ItemsPerPage = source.ItemsPerPage;
            destination.MaxItems = source.MaxItems;
            destination.PagerSuffix = source.PagerSuffix;
            destination.QueryPartRecord = source.QueryPartRecord;
            destination.Skip = source.Skip;
            destination.DisplayPager = source.DisplayPager;

            if (source.LayoutRecord != null)
            {
                var layout = source.LayoutRecord;
                destination.LayoutRecord = new LayoutRecord
                {
                    Category = layout.Category,
                    State = layout.State,
                    Description = layout.Description,
                    Display = layout.Display,
                    DisplayType = layout.DisplayType,
                    Type = layout.Type,
                    QueryPartRecord = layout.QueryPartRecord,
                    GroupProperty = layout.GroupProperty,
                };

                foreach (var item in layout.Properties)
                {
                    destination.LayoutRecord.Properties.Add(item);
                }

                this.layoutRepository.Create(destination.LayoutRecord);
            }
        }

        private void Copy(DataReportViewerPartRecord source, DataReportViewerPartRecord destination)
        {
            destination.ChartTagCssClass = source.ChartTagCssClass;
            destination.ContainerTagCssClass = source.ContainerTagCssClass;
            destination.Report = source.Report;
        }

        private QueryPart GetQuery(string title)
        {
            var query = this.services
                .ContentManager
                .HqlQuery()
                .ForType("Query")
                .Where(c => c.ContentPartRecord<TitlePartRecord>(), c => c.Eq("Title", title))
                .Slice(0, 1)
                .FirstOrDefault();

            return query != null ? query.As<QueryPart>() : null;
        }
    }
}