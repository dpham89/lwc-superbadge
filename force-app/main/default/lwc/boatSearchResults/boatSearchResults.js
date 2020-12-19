import { LightningElement, api, wire, track } from 'lwc';
import { APPLICATION_SCOPE, subscribe, MessageContext, publish } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';
// ...
const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';
export default class BoatSearchResults extends LightningElement {
    @api selectedBoatId;
    columns = [
        { label: 'Name', fieldName: 'Name', editable: true },
        { label: 'Length', fieldName: 'Length__c', editable: true },
        { label: 'Price', fieldName: 'Price__c', editable: true },
        { label: 'Description', fieldName: 'Description__c', editable: true }
    ];
    @api boatTypeId = '';
    @track boats;
    isLoading = false;
    @track
    draftValues = [];

    // wired message context
    @wire(MessageContext)
    messageContext;
    // wired getBoats method 
    @wire(getBoats, { boatTypeId: '$boatTypeId' })
    wiredBoats(result) {
        this.boats = result;
    }

    // public function that updates the existing boatTypeId property
    // uses notifyLoading
    @api
    searchBoats(boatTypeId) {
        this.boatTypeId = boatTypeId;
        this.notifyLoading(this.isLoading);
    }

    // this public function must refresh the boats asynchronously
    // uses notifyLoading
    @api
    async refresh() {
        refreshApex(this.boats);
        this.notifyLoading(this.isLoading);
    }

    // this function must update selectedBoatId and call sendMessageService
    updateSelectedTile(event) {
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(event.detail.boatId);

    }

    // Publishes the selected boat Id on the BoatMC.
    sendMessageService(boatId) {
        publish(this.messageContext, BOATMC, { recordId: boatId });
    }

    // The handleSave method must save the changes in the Boat Editor
    // passing the updated fields from draftValues to the 
    // Apex method updateBoatList(Object data).
    // Show a toast message with the title
    // clear lightning-datatable draft values
    handleSave(event) {
        // notify loading
        this.notifyLoading(this.isLoading);
        const updatedFields = event.detail.draftValues;
        // Update the records via Apex
        updateBoatList({ data: updatedFields })
            .then(() => {
                this.refresh();
                const successEvt = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    variant: SUCCESS_VARIANT,
                    message: MESSAGE_SHIP_IT
                });
                this.dispatchEvent(successEvt);
            })
            .catch(error => {
                const errorEvt = new ShowToastEvent({
                    title: ERROR_TITLE,
                    variant: ERROR_VARIANT
                })
            })
            .finally(() => {
                this.draftValues = '';
            });
    }
    // Check the current value of isLoading before dispatching the doneloading or loading custom event
    notifyLoading(isLoading) {
        const doneloading = new CustomEvent('doneloading');
        const loading = new CustomEvent('loading');
        isLoading ? this.dispatchEvent(doneloading) : this.dispatchEvent(loading);
    }
}
