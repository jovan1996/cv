import { AddressType } from "../enums/address-type.enum";

export class Entity {
    id: number;
    firstName: string;
    lastName: string;
    doctor: number;
    email: string;
    birthDate: Date | string;
    vatCode: string;
    addresses: EntityAddress[];
}


export class EntityAddress {
    type: AddressType;
    name: string;
    phone: string;
    street: string;
    city: string;
    zipCode: string;
}