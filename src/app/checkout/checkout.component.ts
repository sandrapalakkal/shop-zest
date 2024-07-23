import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {

  public payPalConfig?: IPayPalConfig;
  
  checkoutForm = this.fb.group({
    username: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
    address: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9 ]*')]],
    pincode: ['', [Validators.required, Validators.pattern('[0-9]*')]]
  })

  checkoutStatus: boolean = false
  totalAmount: string = ""


  constructor(private fb: FormBuilder, private toaster: ToastrService, private router: Router, private api: ApiService) { }

  cancel() {
    this.checkoutForm.reset()
  }
  proceedToBuy() {
    if (this.checkoutForm.valid) {
      this.checkoutStatus = true
      if (sessionStorage.getItem("total")) {
        this.totalAmount = sessionStorage.getItem("total") || ""
        this.initConfig()
      }
    } else {
      this.toaster.info("Invalid Form!!")
    }
  }

  private initConfig(): void {
    this.payPalConfig = {
      currency: 'USD',
      clientId: 'sb',
      createOrderOnClient: (data) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: this.totalAmount,
          }
        }]
      },
      advanced: {
        commit: 'true'
      },
      style: {
        label: 'paypal',
        layout: 'vertical'
      },
      onApprove: (data, actions) => {
        console.log('onApprove - transaction was approved, but not authorized', data, actions);
        actions.order.get().then((details: any) => {
          console.log('onApprove - you can get full order details inside onApprove: ', details);
        });

      },
      onClientAuthorization: (data) => {
        console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
        //Steps to perform after payment successfully completed
        this.api.emptyCartAPI().subscribe((res: any) => {
          this.api.getCartCount()
          this.toaster.success("Payment Successful.. Thank you for Purchasing with us!!")
          this.checkoutStatus = false
          this.checkoutForm.reset()
          this.router.navigateByUrl('/')
        })
      },
      onCancel: (data, actions) => {
        console.log('OnCancel', data, actions);
        this.toaster.warning("Transaction has been cancelled!!")
        this.checkoutStatus = false
      },
      onError: err => {
        console.log('OnError', err);
        this.toaster.warning("Transaction has been failed..Please try after some time!!")
      },
      onClick: (data, actions) => {
        console.log('onClick', data, actions);
      }
    };
  }
}
