import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgserviceService } from '../ngservice.service';
import { Complain } from '../product';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-productlist',
  templateUrl: './productlist.component.html',
  styleUrls: ['./productlist.component.css']
})
export class ProductlistComponent implements OnInit {
  searchBy: string = 'id'; // Default search criteria
  searchTerm: string = ''; // User input for search
  showProducts = false;
  isLoggedIn = false;
  private roles: string[] = [];
  _productlist: Complain[] = [];
  filteredProductList: Complain[] = []; // List used for filtering

  constructor(private _service: NgserviceService, private _route: Router, private storageService: StorageService) {}

  ngOnInit() {
    this._service.fetchProductListFromRemote().subscribe(
      (data) => {
        this._productlist = data;
        this.filteredProductList = data; // Initialize filtered list
      },
      (error) => console.log('Exception occurred')
    );

    this.isLoggedIn = !!this.storageService.getToken();

    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      this.roles = user.roles;
      this.showProducts = this.roles.includes('ROLE_ADMIN');
    }
  }

  saveStatusChanges() {
    this._service.updateComplaintsStatus(this._productlist).subscribe({
      next: () => this.refreshProductList(),
      error: () => console.log('Error while saving status changes'),
    });
  }

  goToAddProduct() {
    this._route.navigate(['/addproduct']);
  }

  goToEditProduct(complainId: number) {
    this._route.navigate(['/editproduct', complainId]);
  }

  goToViewProduct(complainId: number) {
    this._route.navigate(['/viewproduct', complainId]);
  }

  deleteProduct(complainId: number) {
    const reason = prompt("Please provide the reason for deleting this complaint:");
    if (reason) {
      this._service.deleteProductByIdFromRemote(complainId, reason).subscribe({
        next: () => this.refreshProductList(),
        error: () => console.log('Error while deleting complaint'),
      });
    }
  }

  refreshProductList() {
    this._service.fetchProductListFromRemote().subscribe(
      (data) => (this.filteredProductList = this._productlist = data),
      (error) => console.log('Error refreshing list')
    );
  }

  filterComplaints() {
    const term = this.searchTerm.toLowerCase();

    this.filteredProductList = this._productlist.filter((complaint) => {
      switch (this.searchBy) {
        case 'id':
          return complaint.complainId.toString().includes(term);
        case 'subject':
          return complaint.complainSubject.toLowerCase().includes(term);
        case 'department':
          return complaint.dept.toLowerCase().includes(term);
        case 'building':
          return complaint.building.toLowerCase().includes(term);
        case 'description':
          return complaint.complainDescription.toLowerCase().includes(term);
        case 'priority':
          return complaint.priority.toLowerCase().includes(term);
        case 'status':
          return complaint.status.toLowerCase().includes(term);
        default:
          return false;
      }
    });
  }

}
