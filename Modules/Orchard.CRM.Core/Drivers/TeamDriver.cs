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
using Orchard.ContentManagement.Drivers;
using Orchard.CRM.Core.Models;
using Orchard.Data;

namespace Orchard.CRM.Core.Drivers
{
    public class TeamDriver : CRMContentPartDriver<TeamPart>
    {
        protected IRepository<BusinessUnitPartRecord> businessUnitRepository;

        public TeamDriver(IOrchardServices services, IRepository<BusinessUnitPartRecord> businessUnitRepository)
            : base(services)
        {
            this.businessUnitRepository = businessUnitRepository;
            this.services = services;
        }

        protected override DriverResult Display(
             TeamPart part, string displayType, dynamic shapeHelper)
        {
            string viewName = TeamDriver.GetViewName(displayType, "Team");
            return ContentShape(viewName,
                () => shapeHelper.Parts_Team(
                    Model: part));
        }

        //GET
        protected override DriverResult Editor(TeamPart part, dynamic shapeHelper)
        {
            int? businessUnitId = this.GetPropertyFromRequest("parentId");

            if (businessUnitId != null)
            {
                part.BusinessUnit = this.businessUnitRepository.Get(businessUnitId.Value);
            }

            return ContentShape("Parts_Team_Edit",
                () => shapeHelper.EditorTemplate(
                    TemplateName: "Parts/Team",
                    Model: part,
                    Prefix: Prefix));
        }

        //POST
        protected override DriverResult Editor(
            TeamPart part, IUpdateModel updater, dynamic shapeHelper)
        {
            updater.TryUpdateModel(part, Prefix, null, null);

            int? businessUnitId = this.GetPropertyFromRequest("BusinessUnit.Id");

            if (businessUnitId.HasValue)
            {
                part.BusinessUnit = new Models.BusinessUnitPartRecord { Id = businessUnitId.Value };
            }

            return Editor(part, shapeHelper);
        }
    }
}