const IR_preprocess = function(IR, preprocess_args) {
    // Set EffectiveTime
    if (IR.EffectiveTime.length != 0 && IR.EffectiveTime[0] != "") {
        IR.EffectiveTime[0] = IR.EffectiveTime[0].replace(/,$/, '');
        // console.log(IR.EffectiveTime);
        if (!Number.isNaN(Date.parse(IR.EffectiveTime[0]))) {
            IR.EffectiveTime = [Date.parse(IR.EffectiveTime[0]) / 1000];
        } else {
            IR.EffectiveTime = [preprocess_args.EffectiveTime];
        }
    } else if (preprocess_args != undefined && preprocess_args.EffectiveTime != undefined) {
        // stmts.push(createNumberLiteralAssignment("EffectiveTime", Date.parse(args.EffectiveTime) / 1000));
        IR.EffectiveTime = [preprocess_args.EffectiveTime];
    }
    
    // Set CloseTime
    if (IR.CloseTime.length != 0 && IR.CloseTime[0] != "") {
        IR.CloseTime = IR.CloseTime[0].replace(/,$/, '');
        if (!Number.isNaN(Date.parse(IR.CloseTime[0]))) {
            IR.CloseTime = [Date.parse(IR.CloseTime[0]) / 1000];
        } else {
            IR.CloseTime = [preprocess_args.CloseTime];
        }
    } else if (preprocess_args != undefined && preprocess_args.CloseTime != undefined) {
        // stmts.push(createNumberLiteralAssignment("CloseTime", Date.parse(args.CloseTime) / 1000));
        IR.CloseTime = [preprocess_args.CloseTime];
    }

    // Set OutSideClosingDate
    if (IR.OutSideClosingDate.length != 0 && IR.OutSideClosingDate[0] != "") {
        // console.log(Date.parse(IR.OutSideClosingDate) / 1000);
        IR.OutSideClosingDate = IR.OutSideClosingDate[0].replace(/,$/, '');
        if (!Number.isNaN(Date.parse(IR.OutSideClosingDate[0]))) {
            IR.OutSideClosingDate = [Date.parse(IR.OutSideClosingDate[0]) / 1000];
        } else {
            IR.OutSideClosingDate = [preprocess_args.OutSideClosingDate];
        }
    } else if (preprocess_args != undefined && preprocess_args.OutSideClosingDate != undefined) {
        // stmts.push(createNumberLiteralAssignment("OutSideClosingDate", Date.parse(args.OutSideClosingDate) / 1000));
        IR.OutSideClosingDate = [preprocess_args.OutSideClosingDate];
    }

    for (var k=0; k<IR.Payments.length; ++k) {
        IR.Payments[k].From = [0];
        IR.Payments[k].To = [0];
        IR.Payments[k].PurchasePrice = Math.floor(parseFloat(IR.Payments[k].PurchasePrice));
    }

    return IR;
}


const getValidationCase = function(IR) {
    // Extract condition entry
    condition_entries = {}
    if (IR.EffectiveTime.length != 0 && IR.EffectiveTime[0] != "") condition_entries["EffectiveTimeCon"] = true;
    // if (IR.CloseTime.length != 0 && IR.CloseTime[0] != "") condition_entries["CloseTimeCon"] = true;
    if (IR.Payments.length > 0) condition_entries["PaymentRoleCon"] = true;
    if (IR.Payments[0].TimeLimit != undefined) {
        condition_entries["PaymentTimeCon"] = true;
        condition_entries["PaymentPriceCon"] = true;
        if (IR.Payments[0].Transfer != undefined && IR.Payments[0].Transfer) condition_entries["PaymentTransferCon"] = true;
    }
    if (IR.Transfers) condition_entries["ValidFileSignUploaderCon"] = true;
    if (IR.Terminations.OtherTermination) condition_entries["OtherTerminationCon"] = true;
    if (IR.Terminations.OutOfDateTermination) condition_entries["OutOfDateTerminationCon"] = true;
    if (IR.Terminations.TransferTermination) condition_entries["TransferTerminationCon"] = true;

    // console.log(condition_entries);

    cur_validation_case = JSON.parse(JSON.stringify(condition_entries));
    condition_entries = Object.keys(condition_entries);
    console.log(condition_entries);
    condition_entry_num = condition_entries.length;
    validation_case_num = Math.pow(2, condition_entry_num);
    // console.log(validation_case_num);
    validation_cases = [];
    for (var k=0; k<validation_case_num; ++k) {
        var conf_array = k;
        // console.log(conf_array);
        for (var kk=0; kk<condition_entry_num; ++kk) {
            // console.log(conf_array, conf_array[kk], kk);
            cur_validation_case[condition_entries[kk]] = false;
            if ((conf_array >> kk) & 1) cur_validation_case[condition_entries[kk]] = true;
            else cur_validation_case[condition_entries[kk]] = false;
        }
        // console.log(cur_validation_case);
        validation_cases.push(cur_validation_case);
    }
    return [validation_cases, condition_entries];

}

module.exports = {IR_preprocess, getValidationCase};