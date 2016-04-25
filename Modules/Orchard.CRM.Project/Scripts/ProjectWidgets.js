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

window.crm = window.crm || {};

(function () {
    crm.project = crm.project || {};

    function jqueryPost(action, method, input) {
        "use strict";
        var form;
        form = $('<form />', {
            action: action,
            method: method,
            style: 'display: none;'
        });

        var convertObject = function (objName, objValue) {
            if (typeof objValue === 'object') {

                if (objValue instanceof Array) {
                    var counter = 0;
                    $.each(objValue, function (name, value) {
                        convertObject(objName + '[' + counter + ']', value);
                        counter++;
                    });
                }
                else {
                    for (var name in objValue) {
                        if (objValue.hasOwnProperty(name)) {
                            convertObject(objName + "." + name, objValue[name]);
                        }
                    }
                }
            }
            else {
                $('<input />', {
                    type: 'hidden',
                    name: objName,
                    value: objValue
                }).appendTo(form);
            }
        }

        if (typeof input !== 'undefined') {
            $.each(input, convertObject);
        }

        form.appendTo('body').submit();
    };

    // base class
    crm.project.EditBaseWidget = function (widget) {
        var _self = this;

        this.options = {
            antiForgeryTokenId: "__RequestVerificationToken"
        };

        this.changeLinkToBehaveAsPostRequest = function (event) {
            var href = this.href;

            event.preventDefault();
            var verificationToken = _self.getRequestVerificationToken();

            jqueryPost(href, "POST", verificationToken);
        };

        this.getRequestVerificationToken = function () {
            var antiForgeryToken = $("input[name='" + _self.options.antiForgeryTokenId + "']").val();

            return { __RequestVerificationToken: antiForgeryToken };
        };
    };

    crm.project.FolderListWidget = function (widget) {

        var _self = this;

        this.options = {
            folderListClass: "folder-list",
            folderListContainerClass: "folder-list-container"
        };

        this.initialize = function () {
            var folderList = $("." + _self.options.folderListClass);

            folderList.on("loaded.jstree", function (event, data) {

                /** 
                * Open nodes on load (until x'th level) 
                */
                var depth = 5;
                data.instance.get_container().find('li').each(function (i) {
                    var selectedAttribute = $(this).data("selected");
                    if (selectedAttribute && selectedAttribute.toString() == "true") {
                        folderList.jstree(true).select_node(this);

                        if (data.instance.get_path($(this)).length <= depth) {
                            data.instance.open_node($(this));
                        }
                    }
                });
            }).jstree({
                "default": {
                    draggable: false
                }
            }).on("click", "li.jstree-node a", function () {
                document.location.href = this;
            });

            // scroll the folder container to right
            setTimeout(function () {
                var folderListContainer = $("." + _self.options.folderListContainerClass);

                if (folderListContainer.length == 0) {
                    throw "There is no folder container tag";
                };

                var node = folderListContainer.get(0);
                node.scrollLeft = node.scrollLeft + 10000;
            }, 500);
        };
    };

    crm.project.PeopleInitializationWidget = function (widget) {
        var _self = this;

        this.options = {
            groupsAndAgentsRowCssClass: "groups-and-agents",
            visibleAllCheckboxName: "ProjectItemPermissionsPart.VisibleToAll"
        };

        var selectBoxesInitialized = false;
        this.initialize = function () {
            var checkBox = widget.element.find("input[name='" + _self.options.visibleAllCheckboxName + "']");
            var groupsAndAgentsRow = widget.element.find("." + _self.options.groupsAndAgentsRowCssClass);

            if (checkBox.length == 0) {
                console.log("There is no input with the name:" + _self.options.visibleAllCheckboxName);
                return;
            }

            if (groupsAndAgentsRow.length == 0) {
                console.log("There is no tag with the css:" + _self.options.groupsAndAgentsRowCssClass);
                return;
            }

            if (checkBox.get(0).checked) {
                groupsAndAgentsRow.hide();
            }
            else {
                if (!selectBoxesInitialized) {
                    groupsAndAgentsRow.find("select").chosen();
                    selectBoxesInitialized = true;
                }
            }

            checkBox.on("change", function (event) {
                groupsAndAgentsRow.find("select").chosen();
                if (checkBox.get(0).checked) {
                    groupsAndAgentsRow.hide();
                }
                else {
                    groupsAndAgentsRow.show();
                    if (!selectBoxesInitialized) {
                        groupsAndAgentsRow.find("select").chosen();
                        selectBoxesInitialized = true;
                    }
                }
            });
        };
    };

    crm.project.EditFolderWidget = function (widget) {
        var _self = this;

        this.options = {
            mainFormId: "folderForm",
            folderPickerCssClass: "folder-picker"
        };

        this.initialize = function () {
            var mainForm = $("#" + _self.options.mainFormId);
            var folderPicker = mainForm.find("." + _self.options.folderPickerCssClass);

            var selectedNode = folderPicker.find("li[data-selected='true']");
            // hide radio-buttons
            folderPicker.find("input[type='radio']").hide();

            folderPicker.on("loaded.jstree", function (event, data) {

                //if (selectedNode.length > 0) {
                //    folderPicker.jstree("select_node", selectedNode).trigger("select_node.jstree");
                //}

            }).jstree({
                "ui": {
                    "select_limit": 1  //only allow one node to be selected at a time
                },
                "core": {
                    multiple: false
                }
            }).bind("select_node.jstree", function (event, data) {
                var seletedFolder = data.node.data.id;
                folderPicker.find("input[type='radio'][value='" + seletedFolder + "']").prop('checked', true);
            });
        };
    };

    crm.project.EditFolderItemWidget = function (widget) {
        var _self = this;

        this.options = {
            mainFormId: "folderForm",
            folderPickerCssClass: "folder-picker"
        };

        this.initialize = function () {
            var model = new _self.ModelClass();

            var folderPicker = model.getFolderPicker();

            // hide radio-buttons
            var folderRadioButtons = folderPicker.find("input[type='radio']");
            folderRadioButtons.hide();
            var selectedFolder = folderRadioButtons.filter(":checked");

            folderPicker.on("loaded.jstree", function (event, data) {

                // it is a hack, but there is no easier way around it, the problem is, the tree remove the check attribute of the selected node
                // 
                if (selectedFolder.length > 0) {
                    setTimeout(function () {
                        folderPicker.find("input[type='radio'][value='" + selectedFolder.val() + "']").prop('checked', true)
                    }, 500);
                }
            }).jstree({
                "ui": {
                    "select_limit": 1  //only allow one node to be selected at a time
                },
                "core": {
                    multiple: false
                }
            }).bind("select_node.jstree", function (event, data) {
                var selectedFolder = data.node.data.id;

                selectedFolder = selectedFolder || "";
                var inputs = folderPicker.find("input[type='radio']");
                inputs.prop("checked", false);
                inputs.filter("[value='" + selectedFolder + "']").prop('checked', true);
            });
        };

        this.ModelClass = function () {
            var mainForm = $("#" + _self.options.mainFormId);
            var folderPicker = mainForm.find("." + _self.options.folderPickerCssClass);

            this.getFolderPicker = function () {
                return folderPicker;
            };

            this.getSelectedFolderElement = function () {
                return folderPicker.find("li[data-selected='true']");
            };
        };
    };

    crm.project.deleteDialogModel = function (widget) {
        var _self = this;

        this.options = {
            toolbarId: "discussionMenu",
            removeCssClass: "remove-discussion",
            deleteConfirmDialogId: "deleteConfirmDialog",
            deleteConfirmDialogYesButton: "deleteConfirmDialogYesButton",
            deleteConfirmDialogNoButton: "deleteConfirmDialogNoButton",
        };

        $.extend(_self.options, this.options);

        this.getDeleteDialog = function () {
            return $("#" + _self.options.deleteConfirmDialogId);
        };

        this.getDeleteLink = function () {
            var toolbar = $("#" + _self.options.toolbarId);
            return toolbar.find("." + _self.options.removeCssClass);
        };

        this.getDeleteDialogYesButton = function () {
            return $("#" + _self.options.deleteConfirmDialogYesButton);
        };

        this.getDeleteDialogNoButton = function () {
            return $("#" + _self.options.deleteConfirmDialogNoButton);
        };
    };

    crm.project.deleteController = function (widget, model) {
        var _self = this;

        crm.project.EditBaseWidget.apply(this, arguments);

        this.initialize = function () {
            var removeLink = model.getDeleteLink();
            removeLink.click(removeLinkClick);

            model.getDeleteDialogNoButton().click(function () {
                model.getDeleteDialog().dialog("close");
            });

            model.getDeleteDialogYesButton().click(deleteConfirmDialogYesButtonClickHandler);
        };

        var deleteConfirmDialogYesButtonClickHandler = function (event) {
            var deleteDialog = model.getDeleteDialog();
            var url = deleteDialog.data("url");

            var verificationToken = _self.getRequestVerificationToken();

            jqueryPost(url, "POST", verificationToken);

            event.preventDefault();
        };

        var removeLinkClick = function (event) {
            var deleteDialog = model.getDeleteDialog();
            deleteDialog.data("url", this.href);
            deleteDialog.data("id", $(this).data("id"));
            deleteDialog.dialog({ minHeight: 80, resizable: false });
            event.preventDefault();
        }
    };

    crm.project.wikiTabControlModel = function (widget) {
        var _self = this;

        this.options = {
            wikiContentFileSwitcherId: "wiki-content-file-switcher",
            contentSwitcherClass: "contentSwitcher",
            filesSwitcherClass: "fileSwitcher",
            besideContentClass: "beside-content-2",
            contentClass: "wiki-content"
        };

        var container = $("#" + _self.options.wikiContentFileSwitcherId);

        this.getContentTabHeader = function () {
            return container.find("." + _self.options.contentSwitcherClass);
        };

        this.getFilesTabHeader = function () {
            return container.find("." + _self.options.filesSwitcherClass);
        };

        this.getFilesTab = function () {
            return $("." + _self.options.besideContentClass);
        };

        this.getContentTab = function () {
            return $("." + _self.options.contentClass);
        };
    };

    crm.project.wikiTabsController = function (widget, model) {
        var _self = this;

        crm.project.EditBaseWidget.apply(this, arguments);

        this.initialize = function () {
            var contentSwitcherClass = model.getContentTabHeader();
            var filesSwitcherClass = model.getFilesTabHeader();
            var content = model.getContentTab();
            var besideContent = model.getFilesTab();

            contentSwitcherClass.click(function (e) {
                filesSwitcherClass.removeClass("selected");
                content.removeClass("hidden");
                besideContent.addClass("hidden");
                contentSwitcherClass.addClass("selected");
            });

            filesSwitcherClass.click(function (e) {
                contentSwitcherClass.removeClass("selected");
                besideContent.removeClass("hidden");
                content.addClass("hidden");
                filesSwitcherClass.addClass("selected");
            });
        };
    };

    crm.project.activityStreamDetailViewerController = function (widget, model) {
        var _self = this;

        this.initialize = function () {
            var icons = model.getDetailViewers();
            icons.click(function (event) {
                var container = model.getDetailContainerOfGivenIcon($(this));

                if (container.hasClass("hidden")) {
                    container.removeClass("hidden");
                }
                else {
                    container.addClass("hidden");
                }
            });
        };
    };

    crm.project.activityStreamDetailViewerModel = function (widget) {
        var _self = this;

        this.options = {
            detailViewerClass: "activity-detail-view",
            detailContainerClass: "detail"
        };

        this.getDetailViewers = function () {
            return widget.element.find("." + _self.options.detailViewerClass);
        }

        this.getDetailContainerOfGivenIcon = function (item) {
            return $("#" + item.data("detail-id"));
        };
    };

    crm.project.followerLinkController = function (widget, model) {
        var _self = this;

        this.initialize = function () {
            model.getFollowerLink().click(function (event) {

                var link = this;
                var $link = $(link);
                $.get(this.href, null, function (data) {
                    if (data.IsDone) {
                        var isFollowed = $link.data("follow").toLowerCase();

                        if (isFollowed == "true") {
                            link.href = $link.data("followlink");
                            $link.text($link.data("followtitle"));
                            $link.data("follow", "false");
                        }
                        else {
                            $link.data("follow", "true");
                            link.href = $link.data("unfollowlink");
                            $link.text($link.data("unfollowtitle"));
                        }
                    }
                });

                event.preventDefault();
            });
        };
    };

    crm.project.followerLinkModel = function (widget) {
        var _self = this;

        this.options = {
            followerLinkClass: "follow-link"
        };

        this.getFollowerLink = function () {
            return widget.element.parent().find("." + _self.options.followerLinkClass);
        }
    }

    crm.project.skypeTooltipController = function (widget, model) {

        var _self = this;

        var latestOpenContextMenu = null;

        this.initialize = function () {
            var links = model.getUserLinks()
            links.click(userLinkClickHandler);
            links.each(function () {
                var link = this;
                model.getContextMenuClosebutton(this).click(function (event) {
                    contextMenuCloseButton(event, link);
                });
            });
        };

        var contextMenuCloseButton = function (event, userLink) {
            var contextMenu = model.getContextMenu(userLink);

            contextMenu.hide();
            latestOpenContextMenu = null;
            event.preventDefault();
        }

        var userLinkClickHandler = function (event) {

            var contextMenu = model.getContextMenu(this);

            if (latestOpenContextMenu) {
                latestOpenContextMenu.hide();
            }

            contextMenu.show();
            latestOpenContextMenu = contextMenu;
            event.preventDefault();
        }
    };

    crm.project.skypeTooltipModel = function (widget) {
        var _self = this;

        this.options = {
            userLinkCssClass: "user-link",
            mainContainerClass: "activity-stream",
            subContainerClass: "activity-stream-item",
            contextMenuCssClass: "user-context-menu",
            contextMenuCloseButtonClass: "user-context-menu-close"
        };

        this.getContextMenu = function (userLink) {
            return $(userLink)
                .closest("." + _self.options.subContainerClass)
                .find("." + _self.options.contextMenuCssClass);
        };

        this.getContextMenuClosebutton = function (userLink) {
            return $(userLink)
                .closest("." + _self.options.subContainerClass)
                .find("." + _self.options.contextMenuCloseButtonClass);
        };

        this.getUserLinks = function () {
            return $("." + _self.options.mainContainerClass).find("." + _self.options.userLinkCssClass);
        };
    };

    crm.project.editProjectDashboadPortletsController = function (widget, model) {
        var _self = this;

        this.initialize = function () {
            var portletList = model.getPortletList();
            portletList.sortable({
                update: _self.updateOrderFields
            });
        };

        this.updateOrderFields = function () {
            var portletList = model.getPortletList();

            var order = 0;
            portletList.find("li").each(function () {
                var inputOrder = $(this).find("input[name*='Order']");
                inputOrder.val(order);
                order++;
            });
        };
    };

    crm.project.editProjectDashboadPortletsModel = function (widget) {
        var _self = this;

        this.options = {
            portletListClass: "portlet-list"
        };

        this.getPortletList = function () {
            return widget.element.find("." + _self.options.portletListClass);
        }
    }

    crm.project.editMilestoneController = function (widget, model) {
        var _self = this;

        this.initialize = function () {
            model.getStartTimeElement().datepicker();
            model.getEndtTimeElement().datepicker();
        };
    };

    crm.project.editMilestoneModel = function (widget) {
        var _self = this;

        this.options = {
            startTimeClass: "stat-date",
            endTimeClass: "end-date"
        };

        this.getStartTimeElement = function () {
            return widget.element.find("." + _self.options.startTimeClass);
        };

        this.getEndtTimeElement = function () {
            return widget.element.find("." + _self.options.endTimeClass);
        };
    };

    crm.project.MilestoneBase = function () {

        var _self = this;

        this.translate = function (data, key, text) {
            if (!data.TranslateTable) {
                return typeof text !== "undefined" ? text : key;
            }

            if (typeof data.TranslateTable[key] !== "undefined") {
                return data.TranslateTable[key];
            }

            return typeof text !== "undefined" ? text : key;
        };

        this.getPart = function (shape, partName) {
            if (!shape.ContentItem && !shape.ContentItem.Parts && !shape.ContentItem.Parts.length) {
                return null;
            }

            for (var i = 0; i < shape.ContentItem.Parts.length; i++) {
                var part = shape.ContentItem.Parts[i];
                if (part.PartDefinition && part.PartDefinition.Name == partName) {
                    return part;
                }
            }

            return null;
        }

        this.getSubShape = function (shape, metadataType) {

            // Content
            if (shape.Content && shape.Content.length) {
                for (var i = 0; i < shape.Content.length; i++) {
                    if (shape.Content[i].Metadata.Type == metadataType) {
                        return shape.Content[i];
                    }
                }
            }

            // Header
            if (shape.Header && shape.Header.length) {
                for (var i = 0; i < shape.Header.length; i++) {
                    if (shape.Header[i].Metadata.Type == metadataType) {
                        return shape.Header[i];
                    }
                }
            }

            // Footer
            if (shape.Footer && shape.Footer.length) {
                for (var i = 0; i < shape.Footer.length; i++) {
                    if (shape.Footer[i].Metadata.Type == metadataType) {
                        return shape.Footer[i];
                    }
                }
            }

            return null;
        }

        this.addMainAggregateFields = function (model) {
            model.totalSize = 0;

            for (var j = 0; j < model.Items.length; j++) {
                var item = model.Items[j];

                var part = _self.getPart(item, "AttachToMilestonePart");

                if (part.Record.Size) {
                    model.totalSize += part.Record.Size;
                }
            }
        };
    };

    crm.project.MilestonePlannerController = function (contentContainer, dataContainer) {
        var _self = this;

        // inherits from the base class
        crm.project.MilestoneBase.apply(this, arguments);

        var data = JSON.parse($("#" + dataContainer).html());

        // Translate function
        var T = function (key, text) {
            return _self.translate(data, key, text);
        };

        var getInitialState = function () {
            data.asyncState = "normal";
            return data;
        };

        var setAsyncState = function (state) {
            this.state.asyncState = state;
            this.setState(this.state);
        };

        var render = function () {

            var shape = this.state;

            var model = {
                shape: shape,
                state: shape.asyncState,
                root: {
                    T: T,
                    Routes: data.Routes,
                    Controller: _self,
                    actions: {
                        ticketMenu: ticketContextMenuAction,
                        setAsyncState: this.setAsyncState
                    }
                }
            };

            _self.addMainAggregateFields(this.state.Model);

            // Add necessary menu items for tickets in current milestone
            var milestoneTicketMenu = [
                {
                    Text: T("SendToBacklog", "Send to Backlog"),
                    Id: "SendToBacklog"
                },
                {
                    Text: T("MoveToTop", "Move to top"),
                    Id: "MoveToTop"
                },
                {
                    Text: T("MoveToBottom", "Move to bottom"),
                    Id: "MoveToBottom"
                },
                {
                    Text: T("Edit"),
                    Id: "Edit"
                }
            ];

            // Add necessary menu items for tickets of backlog
            var backlogTicketMenu = [
                {
                    Text: T("SendToTop", "Send to the top of the milestone"),
                    Id: "SendFromBackLogToTop"
                },
                {
                    Text: T("SendToBottom", "Send to the bottom of the milestone "),
                    Id: "SendFromBackLogToBottom"
                },
                {
                    Text: T("Edit"),
                    Id: "Edit"
                }
            ];

            if (data.Model.CanEdit) {
                for (var i = 0; i < shape.Model.Items.length; i++) {
                    var subShape = _self.getSubShape(shape.Model.Items[i], "Parts_Ticket_TableRow");
                    subShape.Model.Menu = milestoneTicketMenu;
                }

                for (var i = 0; i < shape.Model.BacklogMembers.length; i++) {
                    var subShape = _self.getSubShape(shape.Model.BacklogMembers[i], "Parts_Ticket_TableRow");
                    subShape.Model.Menu = backlogTicketMenu;
                }
            }

            return React.createElement(
            "div",
            null,
            React.createElement(orchardcollaboration.react.allComponents.InfoPage, model),
            React.createElement(orchardcollaboration.react.allComponents.MilestonePlanner, model));
        };

        var componentDidUpdate = function () {
            this.applyWidgets();
        };

        var componentDidMount = function () {
            this.applyWidgets();
        };

        var applyWidgets = function () {

            if (!data.Model.CanEdit) {
                return;
            }

            var domNode = $(ReactDOM.findDOMNode(this));

            var _this = this;

            sortableHelper = function (e, ui) {
                ui.children().each(function () {
                    $(this).width($(this).width());
                });
                return ui;
            };

            domNode.find(".current-milestone tbody").sortable({
                helper: sortableHelper,
                cancel: ".pivot",
                stop: function () {
                    handleSortableUpdate(domNode.find(".current-milestone"), false);
                }
            }).disableSelection();

            domNode.find(".backlog tbody").sortable({
                helper: sortableHelper,
                cancel: ".pivot",
                stop: function () {
                    handleSortableUpdate(domNode.find(".backlog"), true);
                }
            }).disableSelection();
        };

        var handleSortableUpdate = function (domNode, isBacklog) {

            var sortableNode = domNode.find("tbody");
            var ids = sortableNode.sortable('toArray', { attribute: 'data-id' });

            // check whether the list is changed or not, in case of no change, nothing must send back to server
            var originalList = isBacklog ? data.Model.BacklogMembers : data.Model.Items;
            if (ids.length == originalList.length) {
                var listOrderIsChanged = false;
                for (var i = 0; i < ids.length; i++) {
                    if (ids[i] != originalList[i].ContentItem.Id) {
                        listOrderIsChanged = true;
                        break;
                    }
                }

                if (!listOrderIsChanged) {
                    sortableNode.sortable('cancel');
                    return;
                }
            }

            var toSubmitData = {
                ProjectId: data.Model.ProjectId,
                Items: []
            };

            for (var i = 0; i < ids.length; i++) {
                toSubmitData.Items.push({
                    MilestoneId: isBacklog ? data.Model.BacklogId : data.Model.MilestoneId,
                    ContentItemId: ids[i],
                    OrderId: i
                });
            }

            var editBaseWidget = new crm.project.EditBaseWidget();
            var verificationToken = editBaseWidget.getRequestVerificationToken();
            $.extend(toSubmitData, verificationToken);

            var url = data.Routes.UpdateMilestoneItems;

            sortableNode.sortable('cancel');
            updateList(isBacklog ? null : ids, isBacklog ? ids : null);
            data.asyncState = "loading";
            _reactComponent.setState(data);

            $.ajax({
                type: "POST",
                url: url,
                data: toSubmitData,
                error: function (e) {
                    data.asyncState = "error";
                    _reactComponent.setState(data);
                }
            }).done(function () {
                data.asyncState = "normal";
                updateList(isBacklog ? null : ids, isBacklog ? ids : null);

                _reactComponent.setState(data);
            });
        };

        var updateList = function (ids, backlogIds) {
            var newItems = [];

            if (ids) {
                for (var i = 0; i < ids.length; i++) {
                    for (var j = 0; j < data.Model.Items.length; j++) {
                        if (ids[i] == data.Model.Items[j].ContentItem.Id) {
                            newItems.push(data.Model.Items[j]);
                        }
                    }

                    for (var j = 0; j < data.Model.BacklogMembers.length; j++) {
                        if (ids[i] == data.Model.BacklogMembers[j].ContentItem.Id) {
                            newItems.push(data.Model.BacklogMembers[j]);
                        }
                    }
                }
            }

            if (backlogIds) {
                var newBackLogMembers = [];
                for (var i = 0; i < backlogIds.length; i++) {
                    for (var j = 0; j < data.Model.BacklogMembers.length; j++) {
                        if (backlogIds[i] == data.Model.BacklogMembers[j].ContentItem.Id) {
                            newBackLogMembers.push(data.Model.BacklogMembers[j]);
                        }
                    }

                    for (var j = 0; j < data.Model.Items.length; j++) {
                        if (backlogIds[i] == data.Model.Items[j].ContentItem.Id) {
                            newBackLogMembers.push(data.Model.Items[j]);
                        }
                    }
                }

                data.Model.BacklogMembers = newBackLogMembers;
            }

            // refreshing the model must be done in the last step, in order to prevent side effect
            // in updating the backlogIds
            if (ids) {
                data.Model.Items = newItems;
            }
        }

        var ticketContextMenuAction = function (actionName, contentItemId) {
            var milestoneIds = [];
            for (var j = 0; j < data.Model.Items.length; j++) {
                if (data.Model.Items[j].ContentItem.Id != contentItemId) {
                    milestoneIds.push(data.Model.Items[j].ContentItem.Id);
                }
            }

            var backlogIds = [];
            for (var j = 0; j < data.Model.BacklogMembers.length; j++) {
                if (data.Model.BacklogMembers[j].ContentItem.Id != contentItemId) {
                    backlogIds.push(data.Model.BacklogMembers[j].ContentItem.Id);
                }
            }

            var toSubmitData = {
                ProjectId: data.Model.ProjectId,
                Items: []
            };

            var editBaseWidget = new crm.project.EditBaseWidget();
            var verificationToken = editBaseWidget.getRequestVerificationToken();
            $.extend(toSubmitData, verificationToken);
            var url = data.Routes.UpdateMilestoneItems;

            switch (actionName) {
                case "Edit":
                    var ticketDisplayRoute = data.Routes.EditTicket;
                    ticketDisplayRoute = decodeURI(ticketDisplayRoute);
                    window.location.href = ticketDisplayRoute.replace("{id}", contentItemId);
                    return;
                case "MoveToBottom":
                    milestoneIds.push(contentItemId);

                    for (var i = 0; i < milestoneIds.length; i++) {
                        toSubmitData.Items.push({
                            MilestoneId: data.Model.MilestoneId,
                            ContentItemId: milestoneIds[i],
                            OrderId: i
                        });
                    } break;
                case "MoveToTop":
                case "SendFromBackLogToTop":
                    milestoneIds.splice(0, 0, contentItemId);

                    for (var i = 0; i < milestoneIds.length; i++) {
                        toSubmitData.Items.push({
                            MilestoneId: data.Model.MilestoneId,
                            ContentItemId: milestoneIds[i],
                            OrderId: i
                        });
                    }
                    break;

                case "SendFromBackLogToBottom":
                    milestoneIds.push(contentItemId);

                    for (var i = 0; i < milestoneIds.length; i++) {
                        toSubmitData.Items.push({
                            MilestoneId: data.Model.MilestoneId,
                            ContentItemId: milestoneIds[i],
                            OrderId: i
                        });
                    }
                    break;

                case "SendToBacklog":
                    backlogIds.push(contentItemId);
                    for (var i = 0; i < backlogIds.length; i++) {
                        toSubmitData.Items.push({
                            MilestoneId: data.Model.BacklogId,
                            ContentItemId: backlogIds[i],
                            OrderId: i
                        });
                    }
                    break;
            }

            data.asyncState = "loading";
            _reactComponent.setState(data);

            $.ajax({
                type: "POST",
                url: url,
                data: toSubmitData,
                error: function (e) {
                    data.asyncState = "error";
                    _reactComponent.setState(data);
                }
            }).done(function () {
                updateList(milestoneIds, backlogIds);
                data.asyncState = "normal";

                // make a deep copy
                var jsonData = JSON.stringify(data);
                data = JSON.parse(jsonData);

                _reactComponent.setState(data);
            });
        };

        // main component
        var milestoneComponent = React.createClass({
            getInitialState: getInitialState,
            setAsyncState: setAsyncState,
            render: render,
            componentDidUpdate: componentDidUpdate,
            componentDidMount: componentDidMount,
            applyWidgets: applyWidgets
        });

        var element = React.createElement(milestoneComponent);
        var _reactComponent = ReactDOM.render(element, document.getElementById(contentContainer));
    };

    crm.project.MilestoneController = function (contentContainer, dataContainer) {
        var _self = this;

        crm.project.MilestoneBase.apply(this, arguments);
        var data = JSON.parse($("#" + dataContainer).html());
        var T = function (key, text) {

            return _self.translate(data, key, text);
        };

        var setAsyncState = function (state) {
            data.asyncState = state;
            this.setState(this.state);
        };

        var filterTicketsClickHandler = function (filterText) {
            data.filterText = filterText;
            this.setState(this.state);
        };

        var filterTickets = function (data, filterText) {
            filterText = filterText || "";
            filterText = filterText.toLowerCase();
            data.Model.FilteredItems = [];

            if (filterText == "") {
                data.Model.FilteredItems = data.Model.Items;
                return;
            }

            for (var i = 0; i < data.Model.Items.length; i++) {
                var item = data.Model.Items[i];
                var part = _self.getPart(item , "TicketPart");
                if (part.Record.Identity && part.Record.Identity.Id == filterText) {
                    data.Model.FilteredItems.push(item);
                    continue;
                }

                var ticketTitle = part.Record.Title.toLowerCase();
                if (ticketTitle.indexOf(filterText) !== -1) {
                    data.Model.FilteredItems.push(item);
                }
            }
        };

        var getInitialState = function () {
            data.asyncState = "normal";
            data.filterText = "";
            return data;
        };

        var addAggregateFieldsToStatusRecords = function (model) {
            // Add aggregation fields to the status records (Number of tickets plus their associated size)
            for (var i = 0; i < model.StatusRecords.length; i++) {
                var statusRecord = model.StatusRecords[i];
                statusRecord.count = 0;
                statusRecord.size = 0;

                for (var j = 0; j < model.Items.length; j++) {
                    var item = model.Items[j];

                    if ((item.StatusId == null && statusRecord.Id == 0) ||
									 item.StatusId == statusRecord.Id) {
                        statusRecord.count++;

                        var part = _self.getPart(item, "AttachToMilestonePart");

                        if (part.Record.Size) {
                            statusRecord.size += part.Record.Size;
                        }
                    }
                }
            }
        };

        var render = function () {
            var model = {
                state: data.asyncState,
                filterText: data.filterText,
                shape: this.state,
                root: {
                    T: T,
                    Routes: data.Routes,
                    Controller: _self,
                    actions: { setAsyncState: this.setAsyncState, filter: this.filterTicketsClickHandler }
                }
            };

            filterTickets(model.shape, model.filterText);
            addAggregateFieldsToStatusRecords(this.state.Model);
            _self.addMainAggregateFields(this.state.Model);

            return React.createElement(
               "div",
               null,
               React.createElement(orchardcollaboration.react.allComponents.InfoPage, model),
               React.createElement(orchardcollaboration.react.allComponents.MilestoneTickets, model));
        };

        var componentDidUpdate = function () {
            this.applyDragAndDrop();
        };

        var componentDidMount = function () {
            this.applyDragAndDrop();
        };

        var applyDragAndDrop = function () {

            var domNode = $(ReactDOM.findDOMNode(this));

            var _reactComponent = this;

            domNode.find("article[data-canedit='true']")
            .draggable({
                helper: function (e) {
                    var item = $(e.target).closest(".ticket-pinboard");
                    var width = item.width();
                    var height = item.height();
                    return "<div style='border: 1px dotted gray; width:" + width + "px; height:" + height + "px; background-color:transparent'></div>";
                }
            });

            domNode.find(".empty-td").droppable({
                accept: function (event) {
                    var draggableId = $(event).data("contentid");

                    var droppableId = $(this).data("contentid");
                    return draggableId != null && droppableId != null && draggableId == droppableId;
                },
                drop: function (event, ui) {
                    var draggable = ui.draggable;
                    handleDragDropUpdate(draggable, $(this), function (newData) {
                        _reactComponent.setState(newData);
                    });
                },
                activeClass: "milestone-drop-active",
                hoverClass: "milestone-drop-hover"
            });
        };

        var handleDragDropUpdate = function (draggable, droppable, callBack) {
            var contentItemId = draggable.data("contentid");
            var targetStateId = droppable.data("status");
            if (targetStateId <= 0) {
                targetStateId = null;
            }

            var toSubmitData = {
                returnUrl: location.href,
                UpdateStatusId: true,
                StatusId: targetStateId,
                Ids: [contentItemId]
            };

            var editBaseWidget = new crm.project.EditBaseWidget();
            var verificationToken = editBaseWidget.getRequestVerificationToken();

            $.extend(toSubmitData, verificationToken);
            var url = data.Routes.QuickTicketUpdate;

            data.asyncState = "loading";
            _reactComponent.setState(data);

            $.ajax({
                type: "POST",
                url: url,
                data: toSubmitData,
                error: function (e) {
                    data.asyncState = "error";
                    _reactComponent.setState(data);
                }
            }).done(function (response) {

                if (response.Errors.length > 0) {
                    data.asyncState = "error";
                    _reactComponent.setState(data);
                    return;
                }

                data.asyncState = "normal";

                // find item in data
                var item = null;
                var ticketPart = null;
                for (var i = 0; i < data.Model.Items.length; i++) {
                    if (data.Model.Items[i].ContentItem.Id == contentItemId) {
                        item = data.Model.Items[i];
                        break;
                    }
                }

                // update item StatusId
                item.StatusId = targetStateId;

                // update TicketPart
                for (var i = 0; i < item.ContentItem.Parts.length; i++) {
                    if (item.ContentItem.Parts[i].PartDefinition.Name == "TicketPart") {
                        ticketPart = item.ContentItem.Parts[i];
                        break;
                    }
                }

                ticketPart.Record.Staus = { Id: targetStateId };

                // Update Model
                for (var i = 0; i < item.Content.length; i++) {
                    var subShape = _self.getSubShape(item, "Parts_Ticket_Pinboard");
                    if (subShape) {
                        subShape.Model.StatusId = targetStateId;
                    }
                }

                callBack(data);
            });
        };

        var milestoneComponent = React.createClass({
            getInitialState: getInitialState,
            render: render,
            setAsyncState: setAsyncState,
            filterTicketsClickHandler: filterTicketsClickHandler,
            componentDidUpdate: componentDidUpdate,
            componentDidMount: componentDidMount,
            applyDragAndDrop: applyDragAndDrop
        });

        var element = React.createElement(milestoneComponent);
        var _reactComponent = ReactDOM.render(element, document.getElementById(contentContainer));
    };

    $.widget("CRM.AttachToProject", {
        options: {
            projectCssClass: "project-select",
            milestoneCssClass: "milestone-select"
        },
        _create: function () {
            var milestoneCombobox = this.element.find("." + this.options.milestoneCssClass);
            var projectCombobox = this.element.find("." + this.options.projectCssClass);

            projectCombobox.change(function () {
                var selectedValue = $(this).val();

                if (!selectedValue || selectedValue == "") {
                    milestoneCombobox.find("option").remove();
                    return;
                };

                var url = milestoneCombobox.data("projectmilestones");
                url = url + "?projectId=" + selectedValue;

                $.get(url, null, function (response) {
                    if (response.IsDone) {
                        milestoneCombobox.find("option").remove();

                        response.Data.Items.forEach(function (item) {
                            var option = "<option value={value}>{text}</option>"
                            var text = item.Text || "";
                            var value = item.Value || "";
                            option = option.replace("{value}", value).replace("{text}", text);
                            milestoneCombobox.append(option);
                        });
                    }
                });
            });
        }
    });

    $.widget("CRM.ProjectMenu", {
        options: {
            pivotCssClass: "pivot",
            projectMenuCssClass: "project-item-menu",
            menuHiddenCssClass: "menu-hidden",
            highlightedPivotCssClass: "selected-pivot"
        },
        _create: function () {
            var _self = this;
            var pivot = this.element.find("." + this.options.pivotCssClass);
            pivot.data("state", "off");
            var menu = this.element.find("." + this.options.projectMenuCssClass);
            menu.removeClass(this.options.menuHiddenCssClass);
            menu.hide();

            // The purpose of this variable is preventing the menu from closing in case the next click outside the menu is so fast
            var latestTimeClick = null;

            pivot.click(function (event) {

                // If the last click happened few handred mili seconds ago, then do noting
                var now = new Date();
                var newTime = now.getTime();

                if (latestTimeClick != null && latestTimeClick + 300 > newTime) {
                    return;
                }
                else {
                    latestTimeClick = newTime;
                }

                event.stopPropagation();
                if (pivot.data("state") == "off") {
                    pivot.data("state", "on");
                    pivot.addClass(_self.options.highlightedPivotCssClass)
                    menu.show();
                }
                else {
                    pivot.data("state", "off");
                    menu.hide();
                    pivot.removeClass(_self.options.highlightedPivotCssClass)
                }
            });

            $("html").click(function () {
                pivot.data("state", "off");
                pivot.removeClass(_self.options.highlightedPivotCssClass)
                menu.hide();
            });
        }
    });

    $.widget("CRM.EditMilestone", {
        _create: function () {
            var model = new crm.project.editMilestoneModel(this);
            $.extend(model.options, this.options);
            this.controller = new crm.project.editMilestoneController(this, model);
            this.controller.initialize();
        }
    });

    $.widget("CRM.EditProjectDashboardPortlets", {
        _create: function () {
            var model = new crm.project.editProjectDashboadPortletsModel(this);
            $.extend(model.options, this.options);
            this.controller = new crm.project.editProjectDashboadPortletsController(this, model);
            this.controller.initialize();
        }
    });

    $.widget("CRM.Skype", {
        _create: function () {
            var model = new crm.project.skypeTooltipModel(this);
            $.extend(model.options, this.options);
            this.controller = new crm.project.skypeTooltipController(this, model);
            this.controller.initialize();
        }
    });

    $.widget("CRM.FollowLink", {
        _create: function () {
            var model = new crm.project.followerLinkModel(this);
            $.extend(model.options, this.options);
            this.controller = new crm.project.followerLinkController(this, model);
            this.controller.initialize();
        }
    });


    $.widget("CRM.ActivityStreamViewer", {
        _create: function () {
            var model = new crm.project.activityStreamDetailViewerModel(this);
            $.extend(model.options, this.options);
            this.controller = new crm.project.activityStreamDetailViewerController(this, model);
            this.controller.initialize();
        }
    });

    $.widget("CRM.WikiItem", {
        options: {},
        _create: function () {
            var tabsModel = new crm.project.wikiTabControlModel(this);
            $.extend(tabsModel.options, this.options);
            this.tabsController = new crm.project.wikiTabsController(this, tabsModel);
            this.tabsController.initialize();

            var deleteModel = new crm.project.deleteDialogModel(this);
            $.extend(deleteModel.options, this.options);
            this.deleteController = new crm.project.deleteController(this, deleteModel);
            this.deleteController.initialize();
        }
    });

    $.widget("CRM.Discussion", {
        options: {},
        _create: function () {

            var deleteModel = new crm.project.deleteDialogModel(this);
            $.extend(deleteModel.options, this.options);
            this.deleteController = new crm.project.deleteController(this, deleteModel);
            this.deleteController.initialize();
        }
    });

    $.widget("CRM.Folder", {
        options: {},
        _create: function () {

            var deleteModel = new crm.project.deleteDialogModel(this);
            deleteModel.options.toolbarId = "folder-toolbar";
            deleteModel.options.removeCssClass = "remove-folder";
            $.extend(deleteModel.options, this.options);
            this.deleteController = new crm.project.deleteController(this, deleteModel);
            this.deleteController.initialize();
        }
    });

    $.widget("CRM.PeopleInitialization", {
        options: {},
        _create: function () {
            this.peopleInitialization = new crm.project.PeopleInitializationWidget(this);
            $.extend(this.peopleInitialization.options, this.options);
            this.peopleInitialization.initialize();
        }
    });

    $.widget("CRM.FolderList", {
        options: {},
        _create: function () {
            this.folderWidget = new crm.project.FolderListWidget(this);
            $.extend(this.folderWidget.options, this.options);
            this.folderWidget.initialize();
        }
    });

    $.widget("CRM.EditFolder", {
        options: {},
        _create: function () {
            this.editFolder = new crm.project.EditFolderWidget(this);
            $.extend(this.editFolder.options, this.options);
            this.editFolder.initialize();
        }
    });

    $.widget("CRM.EditFolderItem", {
        options: {},
        _create: function () {
            this.editFolderItem = new crm.project.EditFolderItemWidget(this);
            $.extend(this.editFolderItem.options, this.options);
            this.editFolderItem.initialize();
        }
    });

})();