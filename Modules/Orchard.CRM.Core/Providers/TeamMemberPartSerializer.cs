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

using Orchard.CRM.Core.Services;
using Orchard.ContentManagement;
using Orchard.CRM.Core.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web;

namespace Orchard.CRM.Core.Providers
{
    public class TeamMemeberPartSerializer : IContetnPartSerializer
    {
        public string ForContentPart { get { return "TeamMemberPart"; } }

        public object GetSerializableObject(ContentPart contentPart)
        {
            if (contentPart.PartDefinition.Name != this.ForContentPart)
            {
                return new ArgumentException(string.Format(CultureInfo.InvariantCulture, "The {1} IContetnPartSerializer can't convert {0}", contentPart.PartDefinition.Name, this.ForContentPart));
            }

            TeamMemberPart teamPart = contentPart as TeamMemberPart;

            return new
            {
                Id = teamPart.Record.Id,
                TeamPartRecord = teamPart.Record.TeamPartRecord != null ?
                new
                {
                    Id = teamPart.Record.TeamPartRecord.Id,
                    Name = teamPart.Record.TeamPartRecord.Name
                } : null,
                UserPartRecord = teamPart.Record.UserPartRecord != null ?
                new
                {
                    Id = teamPart.Record.UserPartRecord.Id,
                    UserName = teamPart.Record.UserPartRecord.UserName
                } : null,
            };
        }
    }
}