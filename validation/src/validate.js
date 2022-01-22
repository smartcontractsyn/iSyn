const OracleTest = artifacts.require("OracleTest");

let validation_config = {
  effectiveTime: 1619366400,
  closeTime: 1000000000,
  expireDate: 1627660800,
  price: 20000000,
  ETHPrice: 100
};

let state_enum = {
  Created: 0,
  Locked: 1,
  Released: 2,
  Transfered: 3,
  Inactive: 4,
};

async function contract_setup(accounts, agreement, contract_config, validation_case) {
    const PAInstance = await agreement.deployed();
    const oracleInstance = await OracleTest.deployed();

    // Setup 3 accounts.
    const acc0 = accounts[0];
    const acc1 = accounts[1];
    const acc2 = accounts[2];

    await PAInstance.setOracleAddress(oracleInstance.address, {from: acc0});

    await PAInstance.setSellerAddress(acc0, { from: acc0 });
    await PAInstance.setBuyerAddress([acc1], { from: acc0 });

    await PAInstance.setAllState(state_enum.Created);

    await oracleInstance.setPrice(validation_config.ETHPrice, {from: acc2});

    assert.equal(contract_config.CloseTime[0] != null, true, "CloseTime not set");

    // Default current time
    await oracleInstance.setTime(contract_config.CloseTime[0] - 10, {from: acc2});

    return [PAInstance, oracleInstance, acc0, acc1, acc2];
}

const single_contract_validate = function(contract_name, agreement, contract_config, validation_case) {

  contract(contract_name, (accounts) => {

    it('Contract set up test', async () => {
    
      [PAInstance, oracleInstance, acc0, acc1, acc2] = await contract_setup(accounts, agreement, contract_config, validation_case);

      for (var i=0; i<contract_config.BuyerName.length; i++) {
        let state = await PAInstance.state.call(i);
        assert.equal(state, state_enum.Created, "The original state " + i + " is not 'Created'!");
      }
    });
  
    it('Payment test', async () => {
  
        [PAInstance, oracleInstance, acc0, acc1, acc2] = await contract_setup(accounts, agreement, contract_config, validation_case);

        let state = await PAInstance.state.call(0);
        assert.equal(state, state_enum.Created, "The original state is not 'Created'!");

        // pay related test

        // Pay iteration
        for (var i=0; i<contract_config.Payments.length; i++) {
  
            var pay_config = contract_config.Payments[i];
            
            if (validation_case.PaymentTimeCon != undefined && !validation_case.PaymentTimeCon) {
                try {
                    await oracleInstance.setTime(contract_config.CloseTime[0] + 10, {from: acc2});
                    await PAInstance.methods["pay_" + i + "()"]({ from: acc1, value: validation_config.price / validation_config.ETHPrice});
                } catch (error) {
                    pay_success = false;
                    console.log(error.reason);
                    console.log("Expected pay failed!");
                }
                state = await PAInstance.state.call(pay_config.From[0]);
                assert.equal(state, state_enum.Created, "Pay succeed under illegal time!"); 
                return;
            }

            if (validation_case.PaymentPriceCon != undefined && !validation_case.PaymentPriceCon) {
                try {
                    await PAInstance.methods["pay_" + i + "()"]({ from: acc1, value: validation_config.price / validation_config.ETHPrice + 20});
                } catch (error) {
                    pay_success = false;
                    console.log(error.reason);
                    console.log("Expected pay failed!");
                }
                state = await PAInstance.state.call(pay_config.From[0]);
                assert.equal(state, state_enum.Created, "Pay succeed under illegal price amount!"); 
                return;
            }

            if (validation_case.PaymentRoleCon != undefined && !validation_case.PaymentRoleCon) {
                try {
                    await PAInstance.methods["pay_" + i + "()"]({ from: acc2, value: validation_config.price / validation_config.ETHPrice});
                } catch (error) {
                    pay_success = false;
                    console.log(error.reason);
                    console.log("Expected pay failed!");
                }
                state = await PAInstance.state.call(pay_config.From[0]);
                assert.equal(state, state_enum.Created, "Pay succeed under illegal payer!"); 
                return;
            }

            try {
                await PAInstance.methods["pay_" + i + "()"]({ from: acc1, value: validation_config.price / validation_config.ETHPrice});
            } catch (error) {
                pay_success = false;
                console.log(error.reason);
                console.log("Unexpected pay failed!");
            }

            state = await PAInstance.state.call(pay_config.From[0]);
            assert.equal(state, state_enum.Locked, "Unexpected pay state to Locked failed!"); 

            // Test pay release with offline delivery confirm
    
            // Test pay release condition
            if (validation_case.PaymentTransferCon != undefined && !validation_case.PaymentTransferCon) {
                try {
                    await PAInstance.methods["payRelease_" + i + "()"]({ from: acc1 });
                } catch (error) {
                    // console.error(error);
                    await console.log("Expected pay Release failed!");
                }
                state = await PAInstance.state.call(pay_config.From[0]);
                assert.equal(state, state_enum.Locked, "pay Release before confirm!");
                return;
            } else {
                if (validation_case.PaymentTransferCon != undefined && validation_case.PaymentTransferCon) {
                    await PAInstance.purchaseConfirm(pay_config.From[0], { from: acc0 });
                    await PAInstance.purchaseConfirm(pay_config.From[0], { from: acc1 });  
                }      

                let old_seller_balance = await web3.eth.getBalance(acc0);

                try {
                    await PAInstance.methods["payRelease_" + i + "()"]({ from: acc1 });
                } catch (error) {
                    await console.error(error);
                    await console.log("Unexpected pay Release failed!"); 
                }   

                state = await PAInstance.state.call(pay_config.From[0]);
                assert.equal(state, state_enum.Released, "pay Release failed!");

                let new_seller_balance = await web3.eth.getBalance(acc0);
                assert.equal(old_seller_balance, new_seller_balance - validation_config.price / validation_config.ETHPrice, "Incorrect pay amount!");     
            }
       
        }
  
    });
  
    if (contract_config.Transfers) {
        it('OfflineDelivery Hash Test', async () => {

            if (validation_case.ValidFileSignUploaderCon != undefined) {
              [PAInstance, oracleInstance, acc0, acc1, acc2] = await contract_setup(accounts, agreement, contract_config, validation_case);
        
              // uploadFileHash test
          
              await PAInstance.uploadFileHash("halo", 22222, {from: acc0});
              await PAInstance.uploadFileHash("helo", 32222, {from: acc1});
          
              // let fhash = await PAInstance.getFileHash("halo", { from: acc0 });
              let fhash = await PAInstance.getFileHash.call("halo", { from: acc0 });
              // console.log("#####" + fhash);
              assert.equal(fhash, 22222, "Incorrect file hash stored!")
          
              if (!validation_case.ValidFileSignUploaderCon) {
                  let success = true;
                  try {
                      await PAInstance.uploadFileHash("halo", 22222, {from: acc2});
                  } catch (error) {
                      await console.error(error);
                      await console.log("Expected Upload file hash failed!");
                      success = false;
                  }               
                  if (success) console.error("Unexpected Upload file hash success!");
              }      
              // await oracleInstance.setConditionState(true, {from: acc2});
            }
      
        });
    }
    
  
    if (contract_config.Terminations.TransferTermination) {
      it('Transfer Termination test', async () => {
        [PAInstance, oracleInstance, acc0, acc1, acc2] = await contract_setup(accounts, agreement, contract_config, validation_case);
  
        // Buyer iteration
        for (var i=0; i<contract_config.BuyerName.length; i++) {
    
          if (!validation_case.TransferTerminationCon) {
            // Test termination transfer condition  
            try {
                await PAInstance.methods["terminateByTransfer(uint256)"](i, { from: acc1 });
            } catch (error) {
                // console.error(error);
                await console.log("Expected terminate by transfer failed!");
            }
            state = await PAInstance.state.call(i);
            assert.notEqual(state, state_enum.Inactive, "Terminate before transfer confirm!");
            return;
          }
    
          await PAInstance.terminateConfirm(i, { from: acc0 });
          await PAInstance.terminateConfirm(i, { from: acc1 });        
          
          try {
            // console.log(PAInstance.methods);
            await PAInstance.methods["terminateByTransfer(uint256)"](i, { from: acc1 });
          } catch (error) {
            await console.error(error);
            await console.log("Unexpected terminate by transfer failed!");
          }
    
          state = await PAInstance.state.call(i);
          assert.equal(state, state_enum.Inactive, "Terminate by transfer failed!");      
        }
      });
    }
  
    if (contract_config.Terminations.OutOfDateTermination) {
      it('Out of Date Termination test', async () => {
        [PAInstance, oracleInstance, acc0, acc1, acc2] = await contract_setup(accounts, agreement, contract_config, validation_case);
  
        // let state = await PAInstance.state.call(0);
        // assert.equal(state, state_enum.Created, "The original state is not 'Created'!");
        if (!validation_case.OutOfDateTerminationCon) {
            await oracleInstance.setTime(contract_config.OutSideClosingDate[0] - 10, {from: acc2});
            try {
                await PAInstance.methods["terminateByOutOfDate()"]({ from: acc1 });
              } catch (error) {
                // console.error(error);
                await console.log("Expected terminate by Out of Date failed!");
            }
            for (var i=0; i<contract_config.BuyerName.length; i++) {
                state = await PAInstance.state.call(i);
                assert.notEqual(state, state_enum.Inactive, "Terminate before out of date!");         
            }
            return;
        }
  
        if (validation_case.OutOfDateTerminationCon) {
            await oracleInstance.setTime(contract_config.OutSideClosingDate[0] + 10, {from: acc2});
  
            try {
              await PAInstance.methods["terminateByOutOfDate()"]({ from: acc1 });
            } catch (error) {
              console.error(error);
              await console.log("Unexpected terminate by Out of Date failed!");
            }  
      
            for (var i=0; i<contract_config.BuyerName.length; i++) {
              state = await PAInstance.state.call(i);
              assert.equal(state, state_enum.Inactive, "Terminate by out of date failed!");         
            }
        }
      });
    }
  
    if (contract_config.Terminations.OtherTermination) {
      it('Other Termination test', async () => {

        [PAInstance, oracleInstance, acc0, acc1, acc2] = await contract_setup(accounts, agreement, contract_config, validation_case);
  
        // let state = await PAInstance.state.call(0);
        // assert.equal(state, state_enum.Created, "The original state is not 'Created'!");

        if (!validation_case.OtherTerminationCon) {
            await oracleInstance.setConditionState(false, {from: acc2});
            // await console.log(await oracleInstance.getConditionState.call({from: acc2}));
            assert.equal(await oracleInstance.getConditionState.call({from: acc2}), false, "Condition state 'false' in OracleTest is not set!");
      
            try {
              await PAInstance.methods["terminateByOthers()"]({ from: acc1 });
            } catch (error) {
              // console.error(error);
              await console.log("Expected terminate by Others failed!");
            }
            
            for (var i=0; i<contract_config.BuyerName.length; i++) {
              state = await PAInstance.state.call(i);
              assert.notEqual(state, state_enum.Inactive, "Terminate before other conditions set!");         
            }
        }

        if (validation_case.OtherTerminationCon) {
            await oracleInstance.setConditionState(true, {from: acc2});
            // await console.log(await oracleInstance.getConditionState.call({from: acc2}));
            assert.equal(await oracleInstance.getConditionState.call({from: acc2}), true, "Condition state 'true' in OracleTest is not set!");
      
            try {
              await PAInstance.methods["terminateByOthers()"]({ from: acc1 });
            } catch (error) {
              console.error(error);
              await console.log("Unexpected terminate by Others failed!");
            }   
      
            for (var i=0; i<contract_config.BuyerName.length; i++) {
              state = await PAInstance.state.call(i);
              assert.equal(state, state_enum.Inactive, "Terminate by Others failed!");         
            }
        }
      });
    }
  });  
}

module.exports = {single_contract_validate};