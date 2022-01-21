# ContractSyn Validation Module

The validation module aims at validating the functionality of synthesized smart contracts under different operation constraint settings. We define the operation constraint set we take into consideration as follows.

```
let all_constraints = [
    'EffectiveTimeCon',
    'PaymentRoleCon',
    'PaymentTimeCon',
    'PaymentPriceCon',
    'PaymentTransferCon',
    'ValidFileSignUploaderCon',
    'OtherTerminationCon',
    'OutOfDateTerminationCon',
    'TransferTerminationCon'
];
```

In detail, we extract operation constraints from SmartIR, and use these operation constraints to construct validation cases, which are fed to the validation flow.

For instance, the following commands extract operation constraints for our evaluation data set.

```
cd validation/test
node batchGenOperationConstraint.js
```

The commands to run the simplest validation example:

```bash
cd validation
truffle develop
test test/singleValidate.js
```




