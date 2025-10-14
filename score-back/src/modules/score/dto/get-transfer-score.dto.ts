import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
@ValidatorConstraint({ name: 'atLeastOne', async: false })
class AtLeastOneConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    return !!(obj.nationalCode || obj.accountNumber);
  }
  defaultMessage(args: ValidationArguments) {
    return 'حداقل یکی از کد ملی یا شماره حساب باید وارد شود';
  }
}

export class GetTransferScoreDto {
  @Validate(AtLeastOneConstraint)
  _atLeastOne!: string;
  //@IsNotEmpty()
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'کد ملی باید عددی باشد' })
  @MaxLength(11)
  @MinLength(5)
  nationalCode: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'شماره حساب باید عددی باشد' })
  @MaxLength(14)
  @MinLength(4)
  accountNumber: string;
}
