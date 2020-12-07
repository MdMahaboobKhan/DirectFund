App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  // url: 'http://127.0.0.1:7545',
  // network_id: 5777,
  chairPerson: null,
  currentAccount: null,
  address:'0x52763210Ff7f117AF849EFFaD7b5a4D80643C065',
  buyingPhases: {
    "SaleInit": { 'id': 0, 'text': "Sale Not Started" },
    "ProposalPhaseStarted": { 'id': 1, 'text': "Rate Proposal Started" },
    "BuyPhaseStarted": { 'id': 2, 'text': "Buying Phase Started" },
    "SaleEnded": { 'id': 3, 'text': "Sale Ended" },
    "ZeroBalance": { 'id': 4, 'text': "Zero Balance!"}
  },
  salePhases: {
    "0": "Sale Not Started",
    "1": "Proposal Phase Started",
    "2": "Buy Phase Started",
    "3": "Sale Ended",
    "4": "Zero Balance"
  },

  init: function () {
    console.log("Checkpoint 0");
    return App.initWeb3();
  },

  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();
    App.populateAddress();
    return App.initContract();
  },

  initContract: function () {
    App.contracts.DirectFund = web3.eth.contract(App.abi).at(App.address);
    App.currentAccount = web3.eth.coinbase;
    jQuery('#current_account').text(App.currentAccount);
    jQuery('#current_account1').text(App.currentAccount);
    App.getCurrentPhase();
    App.getRecipient();
    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '#submit-propose', App.handlePropose);
    $(document).on('click', '#get-winner', App.displayWinner);
    $(document).on('click', '#submit-buy', App.handleBuy);
    $(document).on('click', '#get-returns', App.handleReturns);
    $(document).on('click', '#donate-amt', App.handleDonation);
  },

  populateAddress: function () {
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts, function (i) {
        if (web3.eth.coinbase != accounts[i]) {
          var optionElement = '<option value="' + accounts[i] + '">' + accounts[i] + '</option';
          jQuery('#enter_address').append(optionElement);
        }
      });
    });
  },

  getCurrentPhase: function() {
    App.contracts.DirectFund.state((e,result)=>{
      if(!e){
        App.currentPhase = result;
        var notificationText = App.salePhases[App.currentPhase];
        $('#phase-notification-text').text(notificationText);
      }
    })
  },

  getRecipient: function() {
    App.contracts.DirectFund.recipient((e,result)=>{
      if(!e){
        App.chairPerson = result;
        if(App.currentAccount == App.chairPerson) {
          $(".chairperson").css("display", "inline");
          $(".img-chairperson").css("width", "100%");
          $(".img-chairperson").removeClass("col-lg-offset-2");
        } else {
          $(".other-user").css("display", "inline");
          if(App.currentPhase == 0){
            $(".begining-section").css("display", "inline");
          }
          if(App.currentPhase == 1){
            $(".proposal-section").css("display", "inline");
          }
          else if (App.currentPhase == 2){
            $(".buying-section").css("display", "inline");
          }
          else if (App.currentPhase == 3){
            $(".ending-section").css("display", "inline");
          }
        }
      }
    })

  },

  handlePropose: function () {
    event.preventDefault();
    var bidValue = $("#propose-value").val();
    var msgValue = $("#message-value").val();
    App.contracts.DirectFund.propose(bidValue, { value: web3.toWei(msgValue, "ether") }, (err, result)=>{
      if(!err){
        function pendingConfirmation() {
          web3.eth.getTransactionReceipt(result,(e,rec)=>{
            if(rec){
              clearInterval(myInterval);
              if (parseInt(rec.status) == 1){
                $("#propose-value").val('');
                $("#message-value").val('');
                toastr.info("Your Proposal has been made!", "", { "iconClass": 'toast-info notification0' });
              }
              else
                toastr["error"]("Error in Proposal. Proposal Reverted!");
              }
            if(e){
              clearInterval(myInterval);
              console.log(e);
            }
          })
        }
        const myInterval = setInterval(pendingConfirmation, 3000);
      }else{
        console.log(err);
        toastr["error"]("Proposal Failed!");
      }
    })
  },

  handleDonation:function (){
    console.log("button clicked");
    event.preventDefault();
    var depositValue = $("#deposit-value").val();
    console.log(parseInt(depositValue));
    App.contracts.DirectFund.donate({ value: web3.toWei(depositValue, "ether") },(e,result)=>{
      if(!e){
        function pendingConfirmation(){
          web3.eth.getTransactionReceipt(result,(err,receipt)=>{
            if(receipt){
              clearInterval(myInterval);
              if(parseInt(receipt.status) == 1){
                $("#deposit-value").val('');
                toastr.info("Donation Successful", "", { "iconClass": 'toast-info notification0' });
              }else{
                toastr["error"]("Error in Doantion. Doantion Reverted!");
              }
            }
            if(err){
              clearInterval(myInterval);
              toastr["error"]("Donation Failed!");
              console.log(err);
            }
          })
        }
        const myInterval = setInterval(pendingConfirmation, 3000);
      }else{
        console.log(e);
        toastr["error"]("Donation Failed!");
      }
    })
  },

  handleBuy: function () {
    event.preventDefault();
    var bidRevealValue = $("#proposal-reveal").val();
    var bidRevealSecret = $("#password").val();
    App.contracts.DirectFund.buy(parseInt(bidRevealValue), bidRevealSecret, (err, res)=>{
      if(!err){
        function pendingConfirmation(){
          web3.eth.getTransactionReceipt(res, (err,receipt)=>{
            if(receipt){
              clearInterval(myInterval);
              if (parseInt(receipt.status) == 1){
                $("#proposal-reveal").val('');
                $("#password").val('');
                toastr.info("Your Proposal has been fixed! Wait for next phase", "", { "iconClass": 'toast-info notification0' });
              }
              else
                toastr["error"]("Error in Buying. Buying Reverted!");
            }
            if(err){
              clearInterval(myInterval);
              console.log(err);
            }
          })
        }
        const myInterval = setInterval(pendingConfirmation, 3000);
      }else{
        console.log(err);
        toastr["error"]("Buying Failed!");
      }
    })
  
  },

  handleReturns: function() {
    if(App.currentPhase == 3) {
      App.contracts.DirectFund.getReturns((e,result)=>{
        if(!e){
          function pendingConfirmation(){
            web3.eth.getTransactionReceipt(result, (err,receipt)=>{
              if(receipt){
                clearInterval(myInterval);
                console.log(receipt);
                if ((receipt.status)==1){
                  if(receipt.logs.length>0){
                    App.contracts.DirectFund.allEvents({
                      fromBlock: 0,
                      toBlock: 'latest',
                      address: App.address,
                      topics: [[web3.sha3('ZeroBalance()')]]
                    }, function(error, log){
                      if (!error){
                        if (log.transactionHash == receipt.logs[0].transactionHash){
                          App.showNotification(log.event);
                        }
                      }
                    })
                  }else{
                    toastr.info('Your balance has been withdrawn');
                  }
                }else{
                  toastr["error"]("Error in withdrawing the balance");
                }
              }
              if(err){
                clearInterval(myInterval);
                toastr["error"]("Error in withdrawing the balance");
                console.log(err);
              }
            })
          }
          const myInterval = setInterval(pendingConfirmation, 3000);
        }
      })
    } else {
      toastr["error"]("Not in a valid phase to withdraw balance!");
    }
  },

  displayWinner: function() {
    if(App.currentPhase == 3) {
      App.contracts.DirectFund.getSaleDetails((err,res)=>{
        if(!err){
          function pendingConfirmation(){
            web3.eth.getTransactionReceipt(res, (err,receipt)=>{
              if(receipt){
                clearInterval(myInterval);
                App.contracts.DirectFund.allEvents({
                  fromBlock: 0,
                  toBlock: 'latest',
                  address: App.address,
                  topics: [[web3.sha3('SaleEnded(address,uint)')]]
                }, function(error, log){
                  if (!error){
                    if (log.transactionHash == receipt.logs[0].transactionHash){
                      var winner = log.args.finalBuyer;
                      var highestBid = log.args.finalCost.toNumber();
                      $(".sale-end-message").html("<b><span>Final Selling Price:<b> " + highestBid + " ETH</span>" + "<br><span>Final Buyer: " + winner + "</span>").css("font-family","Times New Roman");
                    }
                  }
                })
              }
              if(err){
                clearInterval(myInterval);
                console.log(err);
              }
            })
          }
          const myInterval = setInterval(pendingConfirmation, 3000);
        }else{
          console.log(err);
          toastr["error"]("Something went wrong!");
        }
      })
    } else {
      toastr["error"]("Not in a valid phase to view winner!");
    }
  },

  //Function to show the notification of auction phases
  showNotification: function (phase) {
    var notificationText = App.buyingPhases[phase];
    $('#phase-notification-text').text(notificationText.text);
    toastr.info(notificationText.text, "", { "iconClass": 'toast-info notification' + String(notificationText.id) });
  },

  abi: [
    {
      "constant": true,
      "inputs": [],
      "name": "saleDetails",
      "outputs": [
        {
          "name": "buyer",
          "type": "address"
        },
        {
          "name": "boughtPrice",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "recipient",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "state",
      "outputs": [
        {
          "name": "",
          "type": "uint8"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "finalBuyer",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "finalCost",
          "type": "uint256"
        }
      ],
      "name": "SaleEnded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "ProposalPhaseStarted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "BuyPhaseStarted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "SaleInit",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "ZeroBalance",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "donate",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "nextPhase",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "encodedAmount",
          "type": "bytes32"
        }
      ],
      "name": "propose",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "proposedRate",
          "type": "uint256"
        },
        {
          "name": "secret",
          "type": "bytes32"
        }
      ],
      "name": "buy",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "getReturns",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "finishSale",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "getSaleDetails",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};


$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      "showDuration": "1000",
      "positionClass": "toast-top-left",
      "preventDuplicates": true,
      "closeButton": true
    };
  });
});
