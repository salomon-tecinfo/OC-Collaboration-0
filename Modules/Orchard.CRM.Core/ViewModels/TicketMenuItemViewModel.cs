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

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Orchard.CRM.Core.ViewModels
{
    public class TicketMenuItemViewModel
    {
        public TicketMenuItemViewModel(
            ICollection<SelectListItem> statusItems,
            ICollection<SelectListItem> dueDateDays,
            ICollection<SelectListItem> users,
            ICollection<BusinessUnitViewModel> businessUnits ,
            ICollection<TeamViewModel> teams
            )
        {
            this.StatusItems = statusItems;
            this.BusinessUnits = businessUnits;
            this.Teams = teams;
            this.Users = users;
            this.DueDateDays = dueDateDays;
        }

        public ICollection<SelectListItem> StatusItems { get; private set; }
        public ICollection<SelectListItem> DueDateDays { get; private set; }
        public ICollection<SelectListItem> Users { get; private set; }
        public ICollection<BusinessUnitViewModel> BusinessUnits { get; private set; }
        public ICollection<TeamViewModel> Teams { get; private set; }
    }
}