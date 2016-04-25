﻿using System;
using Orchard.Autoroute.Services;
using Orchard.Tokens;
using Orchard.Localization;
using Orchard.ContentManagement;
using Orchard.ContentManagement.MetaData.Models;
using Orchard.Autoroute.Models;
using Orchard.Core.Common.Models;

namespace Orchard.Autoroute.Providers {
    public class SlugTokens : ITokenProvider {
        private readonly ISlugService _slugService;

        public SlugTokens(ISlugService slugService) {
            T = NullLocalizer.Instance;
            _slugService = slugService;
        }

        public Localizer T { get; set; }

        public void Describe(DescribeContext context) {
            context.For("Content")
                // /my-item
                .Token("Slug", T("Slug"), T("A slugified version of the item title appropriate for content Urls"))
                // /path/to/my-item
                .Token("Path", T("Path"), T("The full path of an item as already generated by Autoroute"))
                // /path/to/parent-item/
                .Token("ParentPath", T("Parent Path"), T("The parent item's path and slug with an appended forward slash if non-empty"));

            context.For("TypeDefinition")
                // /blog-post
                .Token("Slug", T("Slug"), T("Slugified version of content type display name."));

            context.For("Text")
                .Token("Slug", T("Slug"), T("Slugify the text"));
        }

        public void Evaluate(EvaluateContext context) {
            context.For<IContent>("Content")
                // {Content.Slug}
                .Token("Slug", (content => content == null ? String.Empty : _slugService.Slugify(content)))
                .Token("Path", (content => {
                    var autoroute = content.As<AutoroutePart>();
                    if (autoroute == null) {
                        return String.Empty;
                    }
                    return autoroute.DisplayAlias;
                }))
                // {Content.ParentPath}
                .Token("ParentPath", (content => {
                    var common = content.As<CommonPart>();
                    if (common == null || common.Container == null) {
                        return String.Empty;
                    }
                    var ar = common.Container.As<AutoroutePart>();
                    if (ar == null) {
                        return String.Empty;
                    }
                    if (String.IsNullOrEmpty(ar.DisplayAlias))
                        return String.Empty;
                    return ar.DisplayAlias + "/";
                }));

            context.For<ContentTypeDefinition>("TypeDefinition")
                // {Content.ContentType.Slug}
                .Token("Slug", (ctd => _slugService.Slugify(ctd.DisplayName)));

            context.For<String>("Text")
                .Token("Slug", text => _slugService.Slugify(text));
        }
    }
}