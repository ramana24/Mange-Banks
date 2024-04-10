/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/bankmaster/manage/util/BaseController",
	"fin/cash/bankmaster/manage/util/Creator",
	"fin/cash/bankmaster/manage/util/Updater",
	"fin/cash/bankmaster/manage/util/Deleter",
	"fin/cash/bankmaster/manage/util/Navigator",
	"fin/cash/bankmaster/manage/util/Messager",
	"fin/cash/bankmaster/manage/util/Validator",
	"fin/cash/bankmaster/manage/util/Formatter",
	"sap/fin/central/lib/library",
	"sap/ui/model/json/JSONModel"
], function (BaseController, Creator, Updater, Deleter, Navigator, Messager, Validator, Formatter, CentralLib, JSONModel) {
	"use strict";

	return BaseController.extend("fin.cash.bankmaster.manage.controller.Bank", {
		formatter: Formatter,

		onInit: function (oEvent) {
			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);

			// Secure navigation
			this.version = this.getOwnerComponent()._version;
			//new json model to store the current view status
			var oViewModeModel = new JSONModel();
			var oViewModeData = {
				version: this.version,
				mode: "read",
				hasUsedUnitCount: false
			};
			oViewModeModel.setData(oViewModeData);
			this.getView().setModel(oViewModeModel, "viewMode");

			Validator._initMessagePopover(this);
			this.validatedFields = Validator._initValidatedFields();
			this.byId("messagesIndicator").setVisible(false);
			this.byId("BankViewObjectPageLayout").setShowFooter(false);
			this.oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			//bind data for table
			var oObjectPage = this.byId("BankViewObjectPageLayout");
			var that = this;
			if (!this.version || this.version !== "basic") {
				oObjectPage.attachEvent("subSectionEnteredViewPort", function (oEvent) {
					var oSubSection = oEvent.getParameter("subSection");
					var oSubSectionId = oSubSection.getId();

					if (oSubSectionId.endsWith("relatedBranchSubSection")) {
						that._refreshTable("_IDEGen_fragment3--fin.cash.bankmaster.manage.RelatedBranchesSmartResponsiveTable");
					}
					if (oSubSectionId.endsWith("serviceSubSection")) {
						that._refreshTable("_IDEGen_fragment4--fin.cash.bankmaster.manage.bankfeeservicesmarttable");
					}
					if (oSubSectionId.endsWith("defaultableBPSubSection")) {
						that._refreshTable("defaultBPTableFragment--fin.cash.bankmaster.manage.defaultableBPsmarttable");
					}
					if (oSubSectionId.endsWith("historySubSection")) {
						that._refreshTable("_IDEGen_fragment5--fin.cash.bankmaster.historySmartResponsiveTable");
					}

				});
			}

		},

		onRoutePatternMatched: function (oEvent) {

			if (oEvent.getParameter("name") !== "BankScreen")
				return;

			this.getView().getModel().setDefaultBindingMode("TwoWay");
			//set title
			var sTitle = this.getText("BANK_SEL_TITLE");
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "fin.cash.bankmaster.manage.Component");
				}
			);
			var oMode = oEvent.getParameter("arguments").mode.toLowerCase();
			this.getView().getModel("viewMode").setProperty("/mode", oMode);

			this.bankContextPath = oEvent.getParameter("arguments").bankContextPath;
			var oBankInternalId = oEvent.getParameter("arguments").bankInternalId;

			if (oBankInternalId.indexOf(" ") !== -1) {

				this.bankContextPath = this.bankContextPath.replace(/ /g, "%20");
				this.bankContextPath = encodeURIComponent(this.bankContextPath);

			}
			var previousView = oEvent.getParameter("arguments").previousView;
			var that = this;

			if (this.oCrossAppNavigator) {
				var bNavigateToAcctSupported = this.oCrossAppNavigator.isNavigationSupported([{
					target: {
						semanticObject: "BankAccount",
						action: "manageMasterData"
					}
				}, {
					target: {
						semanticObject: "BusinessPartner",
						action: "manage"
					}
				}]).done(function (aResponse) {
					if (aResponse) {
						that.bNavigateToAcctSupported = aResponse[0].supported;
						that.bNavigateToBPSupported = aResponse[1].supported;
						if (oMode === "create") {
							that.byId("fin.cash.bankmaster.manage.displayButton").setVisible(false);
						} else {
							that.byId("fin.cash.bankmaster.manage.displayButton").setVisible(aResponse[0].supported);
						}

						that.byId("_IDEGen_fragment2--maintainContactPersonButton").setVisible(aResponse[1].supported);
						if (!aResponse[1].supported) {
							that.byId("_IDEGen_fragment2--_IDEGen_columnlistitem0").setType("Inactive");
						} else {
							that.byId("_IDEGen_fragment2--_IDEGen_columnlistitem0").setType("Navigation");
						}
					} else {
						that.bNavigateToAcctSupported = false;
						that.bNavigateToBPSupported = false;
						that.byId("_IDEGen_fragment2--_IDEGen_columnlistitem0").setType("Inactive");
						that.byId("fin.cash.bankmaster.manage.displayButton").setVisible(false);
						that.byId("_IDEGen_fragment2--maintainContactPersonButton").setVisible(false);
					}

				});
			}

			if (oMode === "create") {

				this.byId("BankViewObjectPageLayout").setShowFooter(true);
				that.getView().getModel().metadataLoaded().then(function () {

					that.bankContext = that.getView().getModel().createEntry("/BankSet", {});
					that.getView().setBindingContext(that.bankContext);

				});

			} else {

				that.getView().getModel().read("/" + that.bankContextPath, {
					success: function (oData, oResponse) {
						that.bankCountry = oData.BankCountry;
						that.bankInternalId = encodeURIComponent(oData.BankInternalId);
						that.bpNumber = oData.BpNumber;

						if (previousView !== "createBank" && oData.Hasattachment) {
							var sAttachmentServiceName = CentralLib.environ.AttachmentService.getAttachmentServiceName();
							that.byId("fin.cash.bankmaster.manage.bankUploadCollectionSection").setVisible(true);

							var owner = that.getOwnerComponent();
							if (owner._oComp === null) {
								// owner._oComp.refresh(owner._oComp.getMode(), owner._oComp.getObjectType(), that.bankContextPath);
								var objKey = that.bankContextPath;
								var objType = "BUS1011";
								owner._oComp = sap.ui.getCore().createComponent({
									name: sAttachmentServiceName,
									id: "attachmentsrv.cash",
									settings: {
										mode: "D",
										objectKey: objKey,
										objectType: objType
									}
								});
								that.byId("attachmentServiceFile").setComponent(owner._oComp);
							} else {
								owner._oComp.refresh(owner._oComp.getMode(), owner._oComp.getObjectType(), that.bankContextPath);
							}

							var attrList = owner._oComp.getAttributes();
							var updatedAttrList = that._prepareAttrList(attrList);
							owner._oComp.setAttributes(updatedAttrList);

						} else {
							that.byId("fin.cash.bankmaster.manage.bankUploadCollectionSection").setVisible(false);
						}

					}
				});
				this.bankContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.bankContextPath);

				this.bankCountry = this.bankContextPath.match(/BankCountry='(\S*)',/)[1];
				this.bankInternalId = oBankInternalId;

				if (!this.version || this.version !== "basic") {
					if (that.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.houseBankSmartResponsiveTable")) {
						that.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.houseBankSmartResponsiveTable").rebindTable();
					}
					if (that.byId("_IDEGen_fragment2--fin.cash.bankmaster.manage.contactSmartResponsiveTable")) {
						that.byId("_IDEGen_fragment2--fin.cash.bankmaster.manage.contactSmartResponsiveTable").rebindTable();
					}

				}

				if (oMode === "edit")
					this._toggleEditAndDisplay(true);
				else
					this._toggleEditAndDisplay(false);

			}
			// Set Bank Context
			if (oMode !== "create") {
				this.getView().setBindingContext(this.bankContext);
			}

			if (oMode !== "create") {
				if (this.version !== "basic") {
					//get UsedUnitCount
					this.getUsedUnitCount();

				}
			}
			var oObjectPage = this.byId("BankViewObjectPageLayout");
			oObjectPage._triggerVisibleSubSectionsEvents();

		},

		_refreshTable: function (sTableId) {
			var sTableBindingPath = this.byId(sTableId).getTableBindingPath();
			if (sTableBindingPath.indexOf(this.bankContextPath) === -1) {
				this.byId(sTableId).rebindTable();
			}

		},

		onContactTableInitialized: function () {
			this.contactTableInitialized = true;
			if (this.contactTableInitialized && this.houseBankTableInitial) {
				this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.houseBankSmartResponsiveTable").rebindTable();
				this.byId("_IDEGen_fragment2--fin.cash.bankmaster.manage.contactSmartResponsiveTable").rebindTable();
			}

		},

		onHouseBankTableInitialized: function () {
			this.houseBankTableInitial = true;
			if (this.contactTableInitialized && this.houseBankTableInitial) {
				this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.houseBankSmartResponsiveTable").rebindTable();
				this.byId("_IDEGen_fragment2--fin.cash.bankmaster.manage.contactSmartResponsiveTable").rebindTable();
			}

		},

		_prepareAttrList: function (list) {
			list._VisibleAttributes.UPLOADEDBY = true;
			list._VisibleAttributes.UPLOADEDON = true;
			list._VisibleAttributes.FILESIZE = true;
			list._VisibleAttributes.ENABLELINK = true;
			list._VisibleActions.RENAME = false;
			list._VisibleActions.DELETE = true;
			list._VisibleActions.ADD = true;
			return list;
		},

		onMetadataLoaded: function () {

			this.bankContext = this.getView().getModel().createEntry("/BankSet", {});
			this.getView().setBindingContext(this.bankContext);
		},

		//get used unit count
		getUsedUnitCount: function () {
			this.byId("_IDEGen_fragment0--usedUnitCountField").setText("");
			var oUsedUnitCount;
			var that = this;
			this.getView().getModel().read(that.getView().getBindingContext().getPath() + "/BankToCountInfoSet", {
				success: function (oData, oResponse) {
					if (oResponse.data.results.length > 0) {
						that.getView().getModel("viewMode").setProperty("/hasUsedUnitCount", true);
						oUsedUnitCount = oResponse.data.results[0].UsedUnitCount;
						that.byId("_IDEGen_fragment0--usedUnitCountField").setText(oUsedUnitCount);
					} else {
						that.getView().getModel("viewMode").setProperty("/hasUsedUnitCount", false);

					}
				}
			});
		},

		_toggleEditAndDisplay: function (bStatus) {

			if (this.bNavigateToAcctSupported && !bStatus) {
				this.byId("fin.cash.bankmaster.manage.displayButton").setVisible(!bStatus);
			} else {
				this.byId("fin.cash.bankmaster.manage.displayButton").setVisible(false);
			}

			this.byId("BankViewObjectPageLayout").setShowFooter(bStatus);
		},

		//used unit link navigation
		onUsedUnitLinkPressed: function (oEvent) {
			// Get the selected row path
			var bankContextPath = oEvent.getSource().getBindingContext().getPath().substr(1);

			var bankCountry = this.getView().getModel().oData[bankContextPath].BankCountry;
			var bankInternalId = this.getView().getModel().oData[bankContextPath].BankInternalId;

			if (!bankCountry || !bankInternalId)
				return;

			// Navigate to used units view
			this.getRouter().navTo("ManageUsedUnitsScreen", {
				bankContextPath: "BankSet(BankCountry='" + bankCountry + "',BankInternalId='" + encodeURIComponent(bankInternalId) + "')"
			}, false);
		},

		// ---------------------------------------------
		// Create and Update Functionality
		// ---------------------------------------------

		onSaveButtonPressed: function () {
			this.dataObject = this.getView().getBindingContext().getObject();
			//check whether there are fields with error state
			//bank name
			if (this.getView().byId("_IDEGen_fragment0--bankNameField").getValueState() === "Error") {
				return;
			}

			this.saveSuccess = false;
			this.validatedMessages = [];

			var inputLimit = 3;
			// Non-empty validation
			var nonEmpty = true;
			nonEmpty = Validator._setNonEmptyValidation(this, "_IDEGen_fragment0--bankCountryField", this.getText(
					"NON_EMPTY_VALIDATION_BANK_COUNTRY_TITLE")) &&
				nonEmpty;
			//remove non empty check for bank key, since whether the bank key should be fill is dependent on the backend setting in OY17. 
			//this validation is move to the backend.
			/*nonEmpty = Validator._setNonEmptyValidation(this, "bankKeyField", this.getText("NON_EMPTY_VALIDATION_BANK_KEY_TITLE")) && nonEmpty;*/
			nonEmpty = Validator._setNonEmptyValidation(this, "_IDEGen_fragment0--bankNameField", this.getText(
					"NON_EMPTY_VALIDATION_BANK_NAME_TITLE")) &&
				nonEmpty;
			nonEmpty = Validator._setLimitLength(this, "_IDEGen_fragment0--ratingSelect", this.getText(
					"NON_EMPTY_VALIDATION_RATING_SELECTION_TITLE"), inputLimit) &&
				nonEmpty;

			if (nonEmpty === false) {
				this.pressMode = " ";
				return;
			}

			var that = this;
			if (this.getView().getModel("viewMode").getProperty("/mode") === "create") {

				if (this.getView().byId("_IDEGen_fragment0--bankKeyField").getValue() === "" && this.dataObject.BankInternalId !== "") {
					this.dataObject.BankInternalId = this.getView().byId("_IDEGen_fragment0--bankKeyField").getValue();
				}

				this.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setText(this.getText("SAVING_BUTTON"));

				$.when(Creator._createData(this, "/BankSet", this.getText("CREATE_BANK_SUCCESS_TEXT"), this.getText("CREATE_BANK_ERROR_TEXT"))).then(
					function (res) {
						if (res) {
							that.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(true);
							that.byId("fin.cash.bankmaster.manage.saveButton").setText(that.getText("SAVE_BUTTON"));

							if (that.saveSuccess === true) {
								that.refresh.bankTable = true;
								if (that.pressMode !== "back") {
									that.getRouter().navTo("BankScreen", {
										mode: "read",
										bankContextPath: "BankSet(BankCountry='" + that.getView().getBindingContext().getProperty("BankCountry") +
											"',BankInternalId='" + encodeURIComponent(that.bankInternalId) + "')",
										bankInternalId: encodeURIComponent(that.bankInternalId),
										previousView: "createBank"
									}, true);

								}
								that.pressMode = " ";
							} else {
								that.pressMode = " ";
							}
						}
					});

			} else {

				$.when(Updater._updateData(this, this.getText("UPDATE_BANK_SUCCESS_TEXT"), this.getText("UPDATE_BANK_ERROR_TEXT"), {
					"filterParams": ["BankToAddressSet",
						"BankToHouseBankSet",
						"BankToBpContactSet",
						"BankToUsedCompanySet",
						"BankToUsedBpSet",
						"BankToChangeDocumentSet",
						"BanktoRelatedBranchesSet"
					]
				})).then(function (res) {
					if (res) {

						that.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(true);
						that.byId("fin.cash.bankmaster.manage.saveButton").setText(that.getText("SAVE_BUTTON"));

						if (that.saveSuccess === true) {
							that._toggleEditAndDisplay(false);
							that.getView().getModel("viewMode").setProperty("/mode", "read");
						} else {
							that._toggleEditAndDisplay(true);
						}
						that.refreshBinding(that);

					}
				});
				//fix: when save with error, the view will be also set as display view.
				//this._toggleEditAndDisplay(false);
			}

			that.byId("_IDEGen_fragment5--fin.cash.bankmaster.historySmartResponsiveTable").rebindTable();

		},

		onDeletionMarkChanged: function (oEvent) {
			this.validatedMessages = [];

			if (this.getView().getBindingContext().getObject().HasHouseBanks === "YES" && this.getView().getBindingContext().getObject().DeletionMark ===
				"X") {
				Validator._setValidationMessage(this, "deletionMarkField", "Error", this.getText("MARK_AS_DELETED_HOUSE_BANKS_EXIST_TITLE"));
				this.byId("deletionMarkField").getModel().resetChanges();
			} else if (this.getView().getBindingContext().getObject().DeletionMark === "X") {
				if (this.getView().getBindingContext().getObject().HasBankAccounts === "YES") {
					var that = this;
					sap.m.MessageBox.confirm(that.getText("MARK_AS_DELETED_BANK_ACCOUNTS_EXIST_TEXT"), {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						onClose: function (oAction) {
							if (oAction === "NO") {
								that.byId("deletionMarkField").getModel().resetChanges();
							}
						}
					});
				}
			}

		},

		// ---------------------------------------------
		// Messages Indicator Button Press Event
		// ---------------------------------------------

		onMessagePopoverPressed: function () {
			this.byId("messagesIndicator").setVisible(true);
			this.byId("BankViewObjectPageLayout").setShowFooter(true);
			this.byId("messagesIndicator").setText(this.validatedMessages.length);
			this.messagePopover.openBy(this.byId("messagesIndicator"));
		},

		// ---------------------------------------------
		// Back Button Press Event
		// ---------------------------------------------

		onBackButtonPressed: function () {
			this.pressMode = "back";
			Messager._pressBackButton(this);
		},

		// ---------------------------------------------
		// Cancel Button Press Event
		// ---------------------------------------------

		onCancelButtonPressed: function () {

			Messager._pressCancelButton(this);

		},

		// ---------------------------------------------
		// Edit Button Press Event
		// ---------------------------------------------

		onEditButtonPressed: function () {
			// Edit Bank and Display Bank Switch
			this.getView().getModel("viewMode").setProperty("/mode", "edit");
			this._toggleEditAndDisplay(true);

			// Important: Cash payment logic according to name of bank key property setting
			if (this.bankContext.getProperty().NameOfBankKey === "1")
				this.byId("_IDEGen_fragment0--bankNumberField").setEditable(false);
		},

		onBeforeRebindHouseBankTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			if (this.getView().getModel("viewMode").getProperty("/mode") === "create" || this.version === "basic") {
				bindingParams.preventTableBind = true;
				return;
			}

			this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.houseBankSmartResponsiveTable").setTableBindingPath("/" + this.bankContextPath +
				"/BankToHouseBankSet");
			// Add house bank table loading fields

			//ensure companycode is selected, otherwise, the company name column can't be shown.
			var oSelectParameters = bindingParams.parameters.select;
			if (oSelectParameters && oSelectParameters.indexOf("CompanyCode") !== -1 && oSelectParameters.indexOf("CompanyName") === -1) {
				bindingParams.parameters.select = bindingParams.parameters.select += "," + "CompanyName";
			}
			// Sorter for "CompanyCode"
			bindingParams.sorter.push(new sap.ui.model.Sorter("CompanyCode", false, false));
			bindingParams.parameters["countMode"] = "Inline";
			//add filter for fix bug UI version 1.35 table binding path
			this._filterTable(oEvent);

		},

		onBeforeRebindContactTable: function (oEvent) {

			// Add contact table loading fields
			var bindingParams = oEvent.getParameter("bindingParams");
			if (this.getView().getModel("viewMode").getProperty("/mode") === "create" || this.version === "basic") {
				bindingParams.preventTableBind = true;
				return;
			}
			this.byId("_IDEGen_fragment2--fin.cash.bankmaster.manage.contactSmartResponsiveTable").setTableBindingPath("/" + this.bankContextPath +
				"/BankToBpContactSet");
			// Sorter for "LastName"
			bindingParams.sorter.push(new sap.ui.model.Sorter("LastName", false, false));
			bindingParams.parameters["countMode"] = "Inline";
			//add filter for fix bug UI version 1.35 table binding path
			this._filterTable(oEvent);

		},

		onBeforeRebindServiceCodeTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			if (this.getView().getModel("viewMode").getProperty("/mode") === "create" || this.version === "basic") {
				bindingParams.preventTableBind = true;
				return;
			}
			this.byId("_IDEGen_fragment4--fin.cash.bankmaster.manage.bankfeeservicesmarttable").setTableBindingPath("/" + this.bankContextPath +
				"/BankToBankServiceSet");
			bindingParams.parameters["countMode"] = "Inline";
			this._filterTable(oEvent);
		},

		onBeforeRebindHistoryTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			if (this.getView().getModel("viewMode").getProperty("/mode") === "create" || this.version === "basic") {
				bindingParams.preventTableBind = true;
				return;
			}
			this.byId("_IDEGen_fragment5--fin.cash.bankmaster.historySmartResponsiveTable").setTableBindingPath("/" + this.bankContextPath +
				"/BankToChangeDocumentSet");

			// Add history table loading fields

			// Sorter "Update"
			bindingParams.sorter.push(new sap.ui.model.Sorter("ChangeDate", true, false));
			bindingParams.sorter.push(new sap.ui.model.Sorter("ChangeTime", true, false));
			bindingParams.parameters["countMode"] = "Inline";
			//add filter for fix bug UI version 1.35 table binding path
			this._filterTable(oEvent);

		},

		_filterTable: function (oEvent) {
			if (this.bankCountry && this.bankInternalId) {
				var oFilterBankCountry = new sap.ui.model.Filter("BankCountry", "EQ", this.bankCountry);
				var oBankInternalId = decodeURIComponent(this.bankInternalId);
				var oFilterBankInternalId = new sap.ui.model.Filter("BankInternalId", "EQ", oBankInternalId);
				var filters = [oFilterBankCountry, oFilterBankInternalId];
				oEvent.getParameter("bindingParams").filters.push(new sap.ui.model.Filter(filters, true));
			}
		},

		onDisplayButtonPressed: function (oEvent) {
			// Link BAM app
			var bankContextPath = oEvent.getSource().getBindingContext().getPath().substr(1);

			var bankCountry = bankContextPath.match(/BankCountry='(\S*)',/);
			var bankInternalId = decodeURIComponent(bankContextPath.match(/BankInternalId='(\S*)'/)[1]);

			if (bankCountry && bankInternalId) {
				if (this.oCrossAppNavigator) {
					this.oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "BankAccount",
							action: "manageMasterData"
						},
						params: {
							BankCountry: bankCountry[1],
							Bank: bankInternalId,
							BankAccountStatus: ["02", "09", "10"]
						}
					});
				}

			}
		},

		onBpNumberFieldChanged: function (oEvent) {
			this.byId("fin.cash.bankmaster.manage.contactSmartResponsiveTable").rebindTable();
		},

		// ---------------------------------------------
		// Advanced Address Smart Form
		// ---------------------------------------------

		onAdvancedAddressLinkPressed: function (oEvent) {
			if (this.bankContext.getProperty("AddressId")) {
				// Navigate to Address display or edit mode
				this.getRouter().navTo("AddressScreen", {
					mode: this.getView().getModel("viewMode").getProperty("/mode"),
					bankContextPath: this.bankContextPath,
					addressContextPath: "AddressSet(AddressId='" + this.bankContext.getProperty("AddressId") + "',Nation='')"
				}, false);
			} else {
				// Navigate to Address create mode
				this.getRouter().navTo("AddressScreen", {
					mode: "create",
					bankContextPath: this.bankContextPath,
					addressContextPath: "CreateEntitySet"
				}, false);
			}
		},

		// ---------------------------------------------
		// House Bank Table
		// ---------------------------------------------

		onAddHouseBankIconPressed: function (oEvent) {
			// Navigate to House Bank create mode
			this.getRouter().navTo("HouseBankScreen", {
				mode: "create",
				bankContextPath: this.bankContextPath,
				houseBankContextPath: "CreateEntitySet"
			}, false);
		},

		onHouseBankListItemPressed: function (oEvent) {
			// Navigate to House Bank display or edit mode
			this.getRouter().navTo("HouseBankScreen", {
				mode: this.getView().getModel("viewMode").getProperty("/mode"),
				bankContextPath: this.bankContextPath,
				houseBankContextPath: oEvent.getSource().getBindingContext().getPath().substr(1)
			}, false);
		},

		onDeleteHouseBankIconPressed: function (oEvent) {
			var selectedItems = this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.houseBankSmartResponsiveTable").getTable().getSelectedItems();
			this.validatedMessages = [];

			var that = this;
			if (selectedItems.length === 0) {
				sap.m.MessageBox.warning(this.getText("DELETE_UNSELECTED_HOUSE_BANK"));
			} else {
				sap.m.MessageBox.confirm(that.getText("DELETE_SELECTED_HOUSE_BANK_TEXT"), {
					actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === "DELETE") {
							for (var i in selectedItems) {

								$.when(Deleter._deleteData(that, selectedItems[i].getBindingContextPath(), that.getText("DELETE_HOUSE_BANK_SUCCESS_TEXT"),
									that.getText("DELETE_HOUSE_BANK_ERROR_TEXT"))).then(function (res) {
									if (res && selectedItems.length - 1 == i) {
										that.byId("_IDEGen_fragment5--fin.cash.bankmaster.historySmartResponsiveTable").rebindTable();
										that.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.houseBankSmartResponsiveTable").rebindTable();
									}
								});
							}
						}
					}
				});
			}
		},

		// ---------------------------------------------
		// Contact Table
		// ---------------------------------------------

		onContactListItemPressed: function (oEvent) {
			// Navigate to manage business partner business partner page
			if (this.oCrossAppNavigator) {
				this.oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "BusinessPartner",
						action: "manage"
					},
					params: {
						"BusinessPartnerForEdit": oEvent.getSource().getBindingContext().getObject().ContactPersonNumber
					}
				});
			}

		},

		onMaintainContactPersonPressed: function () {
			var oBank = this.getView().getBindingContext().getObject();
			if (oBank.BpNumber) {

				if (this.oCrossAppNavigator) {
					this.oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "BusinessPartner",
							action: "manage"
						},
						params: {

							"BusinessPartnerGrouping": oBank.BpGroup,
							"BusinessPartnerForEdit": oBank.BpNumber
						}
					});
				}

			} else {
				sap.m.MessageBox.error(this.getText("NO_BP_MAINTAINED_BEFORE_MAINTAIN_CONTACTS"));
			}
		},

		onMarkButtonPressed: function (oEvent) {
			this.dataObject = this.getView().getBindingContext().getObject();
			this.saveSuccess = false;
			this.validatedMessages = [];
			var that = this;

			if (this.dataObject.HasHouseBanks === "YES" && this.dataObject.DeletionMark === "") {
				Validator._setValidationMessage(this, "_IDEGen_fragment0--deletionMarkField", "Error", this.getText(
					"MARK_AS_DELETED_HOUSE_BANKS_EXIST_TITLE"));
			} else if (this.dataObject.DeletionMark === "") {
				if (this.dataObject.HasBankAccounts === "YES") {

					sap.m.MessageBox.confirm(that.getText("MARK_AS_DELETED_BANK_ACCOUNTS_EXIST_TEXT"), {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						onClose: function (oAction) {
							if (oAction === "YES") {
								that.dataObject.DeletionMark = "X";

								$.when(Updater._updateData(that, that.getText("MARK_AS_DELETE_SUCCESS_TEXT"), that.getText("MARK_AS_DELETE_ERROR_TEXT")))
									.then(
										function (res) {
											if (res) {
												that.byId("_IDEGen_fragment5--fin.cash.bankmaster.historySmartResponsiveTable").rebindTable();
												that.byId("fin.cash.bankmaster.manage.editButton").setEnabled(false);
												that.refreshBinding(that);
											}

										});

							}
						}
					});
				} else {
					this.dataObject.DeletionMark = "X";
					$.when(Updater._updateData(this, this.getText("MARK_AS_DELETE_SUCCESS_TEXT"), this.getText("MARK_AS_DELETE_ERROR_TEXT"))).then(
						function (res) {
							if (res) {
								that.byId("fin.cash.bankmaster.manage.editButton").setEnabled(false);
								that.byId("_IDEGen_fragment5--fin.cash.bankmaster.historySmartResponsiveTable").rebindTable();
								that.refreshBinding(that);

							}
						});

				}
			} else if (this.dataObject.DeletionMark === "X") {
				this.dataObject.DeletionMark = "";
				$.when(Updater._updateData(this, this.getText("UNMARK_AS_DELETE_SUCCESS_TEXT"), this.getText("UNMARK_AS_DELETE_ERROR_TEXT"))).then(
					function (res) {
						if (res) {
							that.byId("fin.cash.bankmaster.manage.editButton").setEnabled(true);
							that.byId("_IDEGen_fragment5--fin.cash.bankmaster.historySmartResponsiveTable").rebindTable();
							that.refreshBinding(that);
						}
					});
			}

		},

		// ---------------------------------------------
		// related Branch
		// ---------------------------------------------

		onBeforeRebindRelatedBranchesTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			if (this.getView().getModel("viewMode").getProperty("/mode") === "create" || this.version === "basic") {
				bindingParams.preventTableBind = true;
				return;
			}
			this.byId("_IDEGen_fragment3--fin.cash.bankmaster.manage.RelatedBranchesSmartResponsiveTable").setTableBindingPath("/" + this.bankContextPath +
				"/BanktoRelatedBranchesSet");
			bindingParams.sorter.push(new sap.ui.model.Sorter("BankName", false, false));
			bindingParams.parameters["countMode"] = "Inline";

			//add filter for fix bug UI version 1.35 table binding path
			this._filterTable(oEvent);

		},

		onAddExsitingBanksPressed: function (oEvent) {
			if (this.bpNumber) {
				this.getRouter().navTo("selectExistingBanksScreen", {
					bpNumber: this.bpNumber,
					bankCountry: this.bankCountry,
					bankInternalId: this.bankInternalId
				}, false);
			}

		},

		onDeleteExsitingBanksPressed: function (oEvent) {
			var selectedItems = this.byId("_IDEGen_fragment3--fin.cash.bankmaster.manage.RelatedBranchesSmartResponsiveTable").getTable().getSelectedItems();
			this.validatedMessages = [];

			var that = this;
			if (selectedItems.length === 0) {
				sap.m.MessageBox.warning(this.getText("DELETE_UNSELECTED_RELATED_BRANCHES"));
			} else {
				sap.m.MessageBox.confirm(this.getText("DELETE_SELECTED_RELATED_BRANCHES_TEXT"), {
					actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === "DELETE") {
							for (var i in selectedItems) {

								$.when(Deleter._deleteData(that, selectedItems[i].getBindingContextPath(), that.getText(
									"DELETE_RELATED_BRANCHES_SUCCESS_TEXT"), that.getText("DELETE_RELATED_BRANCHES_ERROR_TEXT"))).then(function (res) {

									if (res && selectedItems.length - 1 == i) {

										that.byId("_IDEGen_fragment3--fin.cash.bankmaster.manage.RelatedBranchesSmartResponsiveTable").rebindTable();
									}
								});

							}

						}
					}
				});
			}
		},

		//service code table
		onAddServiceCodeIconPressed: function (oEvent) {
			// Navigate to Service Code create mode
			this.getRouter().navTo("ServiceMappingScreen", {
				mode: "create",
				bankContextPath: this.bankContextPath,
				serviceCodePath: "CreateEntitySet"
			}, false);
		},

		onServiceCodeListItemPressed: function (oEvent) {
			this.getRouter().navTo("ServiceMappingScreen", {
				mode: this.getView().getModel("viewMode").getProperty("/mode"),
				bankContextPath: this.bankContextPath,
				serviceCodePath: oEvent.getSource().getBindingContext().getPath().substr(1)
			}, false);
		},

		onDeleteServiceCodeIconPressed: function (oEvent) {

			var selectedItems = this.byId("_IDEGen_fragment4--fin.cash.bankmaster.manage.bankfeeservicesmarttable").getTable().getSelectedItems();
			this.validatedMessages = [];

			var that = this;
			if (selectedItems.length === 0) {
				sap.m.MessageBox.warning(this.getText("DELETE_UNSELECTED_SERVICECODE"));
			} else {
				sap.m.MessageBox.confirm(this.getText("DELETE_SELECTED_SERVICECODE_TEXT"), {
					actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === "DELETE") {
							for (var i in selectedItems) {
								$.when(Deleter._deleteData(that, selectedItems[i].getBindingContextPath(), that.getText("DELETE_SERVICECODE_SUCCESS_TEXT"),
									that.getText("DELETE_SERVICECODE_ERROR_TEXT"))).then(function (res) {
									if (res && selectedItems.length - 1 == i) {
										that.byId("_IDEGen_fragment4--fin.cash.bankmaster.manage.bankfeeservicesmarttable").rebindTable();
									}
								});
							}
						}
					}
				});
			}
		},

		//Defaultable BP
		onBeforeRebindDefaultableBPTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			if (this.getView().getModel("viewMode").getProperty("/mode") === "create" || this.version === "basic") {
				bindingParams.preventTableBind = true;
				return;
			}

			this.byId("defaultBPTableFragment--fin.cash.bankmaster.manage.defaultableBPsmarttable").setTableBindingPath("/" + this.bankContextPath +
				"/BankToDefaultableBPSet");
			bindingParams.parameters["countMode"] = "Inline";
			this._filterTable(oEvent);
		},
		onAddDefaulttableBPIconPressed: function (oEvent) {
			// Navigate to defaultable BP create mode
			this.getRouter().navTo("DefaultableBPScreen", {
				mode: "create",
				bankContextPath: this.bankContextPath,
				defaultableBPPath: "CreateEntitySet"
			}, false);

		},
		onDefaultableBPItemPressed: function (oEvent) {
			this.getRouter().navTo("DefaultableBPScreen", {
				mode: this.getView().getModel("viewMode").getProperty("/mode"),
				bankContextPath: this.bankContextPath,
				defaultableBPPath: oEvent.getSource().getBindingContext().getPath().substr(1)
			}, false);
		},
		onBeforeRelatedBankKeyPopoverOpen: function (event) {
			var semanticAttributes = event.getParameters().semanticAttributesOfSemanticObjects;
			var newSemanticAttributes = {};
			newSemanticAttributes.Bank = semanticAttributes.Bank.Bank;
			newSemanticAttributes.BankCountry = semanticAttributes.Bank.RelatedBankCountry;
			event.getParameters().setSemanticAttributes(newSemanticAttributes, "Bank");
			event.getParameters().open();
		}
	});
});