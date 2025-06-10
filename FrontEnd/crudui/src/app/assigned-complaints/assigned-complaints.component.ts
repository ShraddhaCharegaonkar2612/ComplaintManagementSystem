import { Component } from '@angular/core';
import { NgserviceService } from '../ngservice.service'; // Make sure you import your service
import { Complain } from '../product';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-assigned-complaints',
  templateUrl: './assigned-complaints.component.html',
  styleUrls: ['./assigned-complaints.component.css']
})
export class AssignedComplaintsComponent {
  public complaints: Complain[] = []; // Complaints data

  constructor(
    private _service: NgserviceService, // Inject the service to interact with backend
    private _route: Router,
    private _activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchComplaintsByStatus('Assigned');
  }

  // Method to fetch complaints by status
  fetchComplaintsByStatus(status: string): void {
    this._service.fetchComplaintsByStatusFromRemote(status).subscribe({
      next: (data) => {
        console.log('Complaints data received');
        this.complaints = data; // Assign fetched data to the complaints array
      },
      error: (error) => {
        console.log('Error occurred while fetching complaints', error);
      },
    });
  }

  // Navigate to Edit Complaint page
  // goToEditComplaint(complainId: number): void {
  //   this._route.navigate(['/editcomplaint', complainId]);
  // }

  // Navigate to View Complaint page
  goToViewComplaint(complainId: number): void {
    this._route.navigate(['/viewproduct', complainId]);
  }

  // Delete Complaint
  deleteComplaint(complainId: number): void {
    const reason = prompt('Please provide the reason for deleting this complaint:');
    if (reason) {
      this._service.deleteProductByIdFromRemote(complainId, reason).subscribe({
        next: () => this.fetchComplaintsByStatus('Assigned'), // Refresh the list after deletion
        error: (error) => console.log('Error while deleting complaint', error),
      });
    }
  }

  // Save Status Changes
  saveStatusChanges(): void {
    this._service.updateComplaintsStatus(this.complaints).subscribe({
      next: () => console.log('Status updated successfully'),
      error: () => console.log('Error while updating status'),
    });
  }
}
