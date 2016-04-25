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

using Newtonsoft.Json;
using Orchard.ContentManagement;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Orchard.CRM.Core.Providers.Serialization
{
    public class ContentPartConverter : JsonConverter
    {
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            writer.WriteStartObject();
            ContentPart contentPart = value as ContentPart;
            this.WriteCommonFields(writer, contentPart, serializer);

            writer.WriteEnd();
        }

        protected virtual void WriteCommonFields(JsonWriter writer, ContentPart contentPart, JsonSerializer serializer)
        {
            // PartDefinition
            Utility.WriteProperty("PartDefinition", contentPart.PartDefinition, writer, serializer);

            // Id
            Utility.WriteProperty("Id", contentPart.Id, writer, serializer);

            // TypePartDefinition
            Utility.WriteProperty("TypePartDefinition", contentPart.TypePartDefinition, writer, serializer);

            // TypeDefinition
            Utility.WriteProperty("TypeDefinition", contentPart.TypeDefinition, writer, serializer);

            // Fields
            Utility.WriteArray("Fields", contentPart.Fields, writer, serializer);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException("Unnecessary because CanRead is false. The type will skip the converter.");
        }

        public override bool CanRead
        {
            get { return false; }
        }

        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(ContentPart);
        }
    }
}