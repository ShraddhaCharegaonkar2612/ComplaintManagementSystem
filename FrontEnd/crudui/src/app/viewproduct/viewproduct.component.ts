import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {NgForm} from '@angular/forms';
import { NgserviceService } from '../ngservice.service';
import { Complain } from '../product';
import { StorageService } from '../services/storage.service';
@Component({
  selector: 'app-viewproduct',
  templateUrl: './viewproduct.component.html',
  styleUrls: ['./viewproduct.component.css']
})
export class ViewproductComponent {
  showProducts = false;
  isLoggedIn= false;
  private roles: string[] = [];
  public product: Complain = new Complain(0, "", "", "", "", "", 0, 0, "","", "", "", "", "","");
 

  constructor(private  _route:Router,private _service: NgserviceService,private _activatedRoute : ActivatedRoute, private storageService: StorageService) {}

  ngOnInit() {

    let id = parseInt(this._activatedRoute.snapshot.paramMap.get('id')|| '', 10);  //to fetch values from database
    
    this._service.fetchProductByIdFromRemote(id).subscribe(
      {
        next: (data) => {
          console.log("data recieved");
          this.product=data;
        },
        error: (error) => console.log("error occurred") 
      }
    )

   
      this.isLoggedIn = !!this.storageService.getToken();
      if (this.isLoggedIn) {
        const user = this.storageService.getUser();
        this.roles = user.roles;
        this.showProducts = this.roles.includes('ROLE_ADMIN');
      }
 
  }



  
  gotolist(){
    console.log('go back');
    this._route.navigate(['productlist']);
  }

  goToEditProduct(complainId: number) {
    console.log('Editing complaint with id ' + complainId);
    this._route.navigate(['/editproduct', complainId]);
  }
  
  


 printDetails() {
  const printWindow = window.open('', '', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Complaint Details - ${this.product?.complainId}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-header h2 { color: #000; margin-bottom: 10px; }
            .print-content { display: flex; flex-direction: column; }
            .print-image { text-align: center; margin-bottom: 20px; }
            .print-image img { max-width: 50%; height: auto; }
            .print-details { margin-top: 20px; }
            .priority-high { 
              background-color: #e74c3c; 
              color: white; 
              padding: 5px 10px; 
              border-radius: 5px;
              display: inline-block;
              margin-bottom: 15px;
            }
            .detail-row { margin-bottom: 10px; }
            .detail-label { font-weight: bold; }
            @page { size: auto; margin: 10mm; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>Complaint Details</h2>
            ${this.product?.priority === 'High' ? 
              `<div class="priority-high">High Priority</div>` : ''}
            <p>Printed on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="print-content">
            ${this.product?.imageOfSubject ? 
              `<div class="print-image">
                <img src="${this.product.imageOfSubject}" alt="Complaint Image">
              </div>` : ''}
            
            <div class="print-details">
              ${this.getPrintableDetails()}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
}

getPrintableDetails(): string {
  if (!this.product) return '';
  
  return `
    <div class="detail-row"><span class="detail-label">Complaint ID:</span> ${this.product.complainId}</div>
    <div class="detail-row"><span class="detail-label">Subject:</span> ${this.product.complainSubject}</div>
    <div class="detail-row"><span class="detail-label">Description:</span> ${this.product.complainDescription}</div>
    <div class="detail-row"><span class="detail-label">Department:</span> ${this.product.dept}</div>
    <div class="detail-row"><span class="detail-label">Building:</span> ${this.product.building}</div>
    <div class="detail-row"><span class="detail-label">Floor:</span> ${this.product.floorNo}</div>
    <div class="detail-row"><span class="detail-label">Room:</span> ${this.product.roomNo}</div>
    <div class="detail-row"><span class="detail-label">Created Date:</span> ${this.product.createdDate}</div>
  `;
}



// Add this to your component class
printMarathi() {
  const translations: { [key: string]: string } = {
    'Complain Details': 'तक्रारीचा तपशील',
    'Complain ID': 'तक्रार क्रमांक',
    'Complain Subject': 'तक्रारीचा विषय',
    'Complain Description': 'तक्रारीचे वर्णन',
    'Role of Complainer': 'तक्रारदाराची भूमिका',
    'Department': 'विभाग',
    'Room Number': 'खोली क्रमांक',
    'Floor Number': 'मजला क्रमांक',
    'Building': 'इमारत',
    'Email': 'ईमेल',
    'Created Date': 'तारीख',
    'High Priority': 'उच्च प्राधान्य',
    'Printed on': 'छापली दिनांक'
  };

  const printWindow = window.open('', '', 'width=800,height=600');
  
  if (printWindow && this.product) {
    // Translate the content
    const translatedContent = this.getTranslatedContent(translations);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>तक्रारीचा तपशील - ${this.product.complainId}</title>
          <style>
            body { font-family: Arial, "Nirmala UI"; padding: 20px; direction: ltr; }
            .print-header { text-align: center; margin-bottom: 20px; }
            .print-content { display: flex; flex-direction: column; }
            .print-image { text-align: center; margin-bottom: 20px; }
            .print-image img { max-width: 50%; height: auto; }
            .priority-high { 
              background-color: #e74c3c; 
              color: white; 
              padding: 5px 10px;
              border-radius: 5px;
              display: inline-block;
              margin-bottom: 15px;
            }
            .detail-row { margin-bottom: 10px; }
            .detail-label { font-weight: bold; }
            @page { size: auto; margin: 10mm; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>${translations['Complain Details']}</h2>
            ${this.product.priority === 'High' ? 
              `<div class="priority-high">${translations['High Priority']}</div>` : ''}
            <p>${translations['Printed on']} ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="print-content">
            ${this.product.imageOfSubject ? 
              `<div class="print-image">
                <img src="${this.product.imageOfSubject}" alt="Complaint Image">
              </div>` : ''}
            
            <div class="print-details">
              ${translatedContent}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
}

getTranslatedContent(translations: { [key: string]: string }): string {
  if (!this.product) return '';
  
  return `
    <div class="detail-row"><span class="detail-label">${translations['Complain ID']}:</span> ${this.product.complainId}</div>
    <div class="detail-row"><span class="detail-label">${translations['Complain Subject']}:</span> ${this.product.complainSubject}</div>
    <div class="detail-row"><span class="detail-label">${translations['Complain Description']}:</span> ${this.product.complainDescription}</div>
    <div class="detail-row"><span class="detail-label">${translations['Role of Complainer']}:</span> ${this.product.roleOfComplainer}</div>
    <div class="detail-row"><span class="detail-label">${translations['Department']}:</span> ${this.product.dept}</div>
    <div class="detail-row"><span class="detail-label">${translations['Room Number']}:</span> ${this.product.roomNo}</div>
    <div class="detail-row"><span class="detail-label">${translations['Floor Number']}:</span> ${this.product.floorNo}</div>
    <div class="detail-row"><span class="detail-label">${translations['Building']}:</span> ${this.product.building}</div>
    <div class="detail-row"><span class="detail-label">${translations['Email']}:</span> ${this.product.email}</div>
    <div class="detail-row"><span class="detail-label">${translations['Created Date']}:</span> ${this.product.createdDate}</div>
  `;
}
}
