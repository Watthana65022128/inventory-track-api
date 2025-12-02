import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsAllowedEmailDomainConstraint implements ValidatorConstraintInterface {
  validate(email: string) {
    if (!email) return false;

    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
      ? process.env.ALLOWED_EMAIL_DOMAINS.split(',')
      : ['company.com', 'gmail.com'];

    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  }

  defaultMessage() {
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
      ? process.env.ALLOWED_EMAIL_DOMAINS.split(',')
      : ['company.com', 'gmail.com'];

    return `Email must be from allowed domains: ${allowedDomains.map((d) => '@' + d).join(', ')}`;
  }
}

export function IsAllowedEmailDomain(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAllowedEmailDomainConstraint,
    });
  };
}
