import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { Entity, EntityAddress } from '../../models/entities/entity';
import { AddressType } from '../../models/enums/address-type.enum';

@Component({
  selector: 'app-form-detail',
  templateUrl: './form-detail.component.html',
  styleUrls: ['./form-detail.component.css']
})
export class FormDetailComponent implements OnInit {

  entityForm: FormGroup;

  vatRequired = false;
  isNew: boolean;
  progressBar: boolean;

  id: string | number;
  addressTypes: { id: number, name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.mapEnums();
    this.initForm();
    this.subscribeToFormChanges();
    this.initData();
    this.initServices();
  }


  //#region  form initialization
  initServices() {

  }

  initData() {
    this.route.paramMap.subscribe(param => {
      this.id = param.get('id');
      this.isNew = this.id === 'new' ? true : false;
      if (this.isNew) {
        this.progressBar = false;
      }
    });
  }

  initForm() {
    this.entityForm = this.fb.group({
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
      birthDate: new FormControl('', Validators.required),
      vatCode: new FormControl(''),
      email: new FormControl('', Validators.compose([Validators.required, Validators.email])),
      doctor: new FormControl('', Validators.required),
      phoneNumber: new FormControl(''),
      addresses: this.fb.array([this.createAddressFormGroup()])
    });
  }

  subscribeToFormChanges() {
    this.controls.doctor.valueChanges.pipe(
      debounceTime(200),
    ).subscribe(
      text => {
        // autocompete
      }
    );
  }

  addEvent(type: string, event: any) {
    let date: Date = event.value;

    if (date === null) {
      this.vatRequired = false;
    } else {
      let age = this.getAge(date);
      if (age > 18) { // is older than.
        this.vatRequired = true;
        this.controls.vatCode.setValidators(Validators.required);
        this.controls.vatCode.updateValueAndValidity();
      } else {
        this.vatRequired = false;
        this.controls.vatCode.clearValidators();
        this.controls.vatCode.updateValueAndValidity();
      }
    }
  }

  mapEnums() {
    for (const n in AddressType) {
      if (typeof AddressType[n] === 'number') {
        this.addressTypes.push({ id: Number.parseInt(AddressType[n]), name: n });
      }
    }
  }
  //#endregion

  //#region form addresses

  createAddressFormGroup(): FormGroup {
    let fg: FormGroup = new FormGroup({
      'phoneNumber': new FormControl('', Validators.compose([Validators.pattern('^\\+?[0-9\s]+$')])),
      'street': new FormControl('', Validators.required),
      'city': new FormControl('', Validators.required),
      'zipCode': new FormControl('', Validators.required),
      'country': new FormControl('', Validators.required)
    });

    const arr = this.getAddresList();

    if (arr.length > 0) {
      fg.addControl('type', new FormControl('', Validators.required))
      fg.updateValueAndValidity();
      this.entityForm.updateValueAndValidity();
    }

    return fg;
  }

  addAddressFormGroup() {
    const arr = this.getAddresList();
    arr.push(this.createAddressFormGroup());
  }

  removeAddressFormGroup(i: number) {
    const arr = this.getAddresList();
    if (arr.length > 1) {
      arr.removeAt(i)
    } else {
      arr.reset()
    }
    arr.updateValueAndValidity();
    this.entityForm.updateValueAndValidity();
  }

  getAddresList(): FormArray {
    let arr = this.controls?.addresses as FormArray;

    if (arr === undefined) {
      return this.fb.array([]);
    } else {
      return arr;
    }
  }

  onFocusPhone(index) {
    let phone: FormControl = this.getPhoneControl(index);
    if (phone.value === '' || phone.value === null || phone.value === undefined) {
      phone.setValue('+39');
    }
  }

  onfocusoutPhone(index) {
    let phone: FormControl = this.getPhoneControl(index);
    let newData = phone.value.replace(/\s/g, "");
    phone.setValue(newData);
  }

  getPhoneControl(index): FormControl {
    let arr: FormArray = this.getAddresList();
    let group: FormGroup = arr.controls[index] as FormGroup;
    let phone: FormControl = group.controls.phoneNumber as FormControl;
    return phone;
  }

  checkAddressType(index): boolean {
    let arr: FormArray = this.getAddresList()
    let group: FormGroup = arr.controls[index] as FormGroup;
    let controlName = group.controls.name;
    return (controlName === undefined || index === 0) ? false : true;
  }

  onSelectAddressType(type, index) {

    let arr: FormArray = this.getAddresList();
    let group: FormGroup = arr.controls[index] as FormGroup;

    if (type.id === AddressType['Work'] || type.id === AddressType['Close relative']) {

      if (group.controls['name'] === undefined) {
        group.addControl('name', new FormControl('', Validators.required));
        arr.controls[index] = group;
      }
    } else {
      if (group.controls['name'] !== undefined) {
        group.removeControl('name');
        arr.controls[index] = group;
      }
    }

    arr.controls[index].updateValueAndValidity();
  }

  //#endregion

  //#region  validation

  markTouched() {
    this.markGroup(this.entityForm);
  }

  markGroup(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      switch (formGroup.get(key).constructor.name) {
        case "FormGroup":
          this.markGroup(formGroup.get(key) as FormGroup);
          break;
        case "FormArray":
          this.markArray(formGroup.get(key) as FormArray);
          break;
        case "FormControl":
          this.markControls(formGroup.get(key) as FormControl);
          break;
      }
    });
  }

  markArray(formArray: FormArray) {
    formArray.controls.forEach(control => {
      switch (control.constructor.name) {
        case "FormGroup":
          this.markGroup(control as FormGroup);
          break;
        case "FormArray":
          this.markArray(control as FormArray);
          break;
        case "FormControl":
          this.markControls(control as FormControl);
          break;
      }
    });
  }

  markControls(formControl: FormControl) {
    formControl.markAsTouched();
    formControl.markAsDirty();
  }

  checkControlState(controlName): boolean {
    let control = this.controls[controlName];

    return (control !== undefined && control.invalid
      && (control.touched || control.dirty))
  }

  getControlErrorMessage(control: FormControl): string {
    let errors = '';

    if (control !== null && control !== undefined && control.errors) {

      if ((control.errors['required'])) {
        errors += "Field is required. <br>"
      }

      if ((control.errors['pattern'])) {
        errors += "Data is in bad format. <br>"
      }

      if ((control.errors['email'])) {
        errors += "Email is in bad format. <br>"
      }

      if ((control.errors['minlength'])) {
        //
      }

      if ((control.errors['maxlength'])) {
        //
      }
    }

    return errors;
  }



  //#endregion

  //#region  data manipulation
  save() {
    if (this.entityForm.valid) {
      this.progressBar = true;

      let obj: Entity = this.patchFormToObject();

      if (this.isNew) {
        // this.entityService.post(obj).subscribe(
        //   () => { },
        //   () => {
        //     this.progressBar = false;
        //   },
        //   () => {
        //     this.progressBar = false;
        //     this.router.navigate(['']);
        //   },
        // );
      }
    } else {
      this.markTouched();
    }
  }

  patchFormToObject(): Entity {
    var obj = new Entity();
    obj.doctor = this.controls.doctor.value.id;
    obj.firstName = this.controls.firstName.value;
    obj.lastName = this.controls.lastName.value;
    obj.lastName = this.controls.lastName.value;
    obj.email = this.controls.email.value;
    obj.vatCode = this.controls.vatCode.value;
    obj.addresses = [];

    let arr: FormArray = this.getAddresList();

    arr.controls.forEach(element => {
      console.log(element);
      let address = new EntityAddress();
      address.city = element.value.city;
      address.name = element.value.name;
      address.street = element.value.street;
      address.zipCode = element.value.zipCode;
      obj.addresses.push(address)
    });

    return obj;
  }

  getAge(dateString) {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  get controls() {
    return this.entityForm?.controls;
  }

  //#endregion

}
