const appName = 'arweave-identicons';
const appVersion = '1.0.0';
var arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});
var wallet;
var arweaveID;

// credits to https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function getTransactionsFromApp(app, address){
    const transactions = await arweave.arql({
		op: 'and',
		expr1:
			{
				op: 'equals',
				expr1: 'App-Name',
				expr2: app
			},
		expr2:
			{
				op: 'equals',
				expr1: 'from',
				expr2: address,
			},
	});
	return transactions;
}

function generateTableItem(img, text){
	return '<tr><td><img src="' + img + '" class="img-fluid img-thumbnail" width="120px" style="min-width: 80px"></td><td class="align-middle"><a href="https://viewblock.io/arweave/tx/' + text + '">' + text + '</a></td></tr>';
}

async function populateTable(txs){
	$('#awesometable tr').remove();
	if (txs.length > 0){
		$('.identitable').show();
		await asyncForEach(txs, async (x) => {
			const data = await arweave.transactions.getData(x, {decode: true, string: true});
			$('#awesometable').append(generateTableItem(data, x));
		});
		$('.loading-2').hide();
	} else {
		$('.loading-2').show();
		$('.identitable').hide();
	}
}

async function updateTable(address){
	txs = await getTransactionsFromApp(appName, address);
	await populateTable(txs);
}

async function getArweaveID(address){
	const txs = await getTransactionsFromApp('arweave-id', address);
	if (txs.length > 0){
		const data = await arweave.transactions.getData(txs[0], {decode: true, string: true});
		return { hasID: true, dataID: data };
	} else {
		return { hasID: false };
	}
}

async function process_login(address){
	updateIdenticon();
	$('.not-logged-in').hide();
	$('.logged-in').show();
	$('.identicon-creator').hide();
	$('.loading-1').show();
	arweaveID = await getArweaveID(address);
	$('.identicon-creator').show();
	$('.loading-1').hide();	
	$(".arw-id").attr('disabled', !arweaveID.hasID);
	await updateTable(address);
	$('#ar-address').show();
	$('#ar-address').html(address + '<a href="#" onclick="signOut();"> (sign out)</a>');	
}
  
async function login (files){
    var fr = new FileReader();
    fr.onload = async function (ev){
        try {
            wallet = JSON.parse(ev.target.result);
			
            const address = await arweave.wallets.jwkToAddress(wallet);
			await process_login(address);
        } catch (err) {
            alert('Error logging in: ' + err);
        }
    }
    fr.readAsText(files[0]);
}

async function uploadToArweave(){
	$('#button-n').hide();
	$('#button-l').show();
	
	const identiData = getIdenticon();
    var tx = await arweave.createTransaction({data: identiData,}, wallet);
    tx.addTag('App-Name', appName);
    tx.addTag('App-Version', appVersion);
    await arweave.transactions.sign(tx, wallet);
    await arweave.transactions.post(tx);
    alert('Your identicon has been uploaded!\nJust wait till the tx gets confirmed and log in again to see it.');

	$('#button-l').hide();
	$('#button-n').show();
}

function generateIdenticon(text){
    const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8', numRounds: 200 });
	shaObj.update(text);
	const hash = shaObj.getHash('HEX');
	const data = new Identicon(hash, {background: [255, 255, 255, 255], size: 240}).toString();
    return 'data:image/png;base64,' + data;
}

function getIdenticon(){
    return $("#imgIdenticon")[0].src;
}

function setIdenticon(text){
    $("#imgIdenticon")[0].src = generateIdenticon(text);
}

function updateIdenticon(){
	const option = $('input:radio[name=identi]:checked').val();
	const pk = wallet.n; //public key
	var identicon;
	switch (option){
		case "1": 
			identicon = generateIdenticon(pk);
			break;
			
		case "2":
			identicon = generateIdenticon(arweaveID.dataID + pk);
			break;
			
		case "3":
			const customText = $('#custom-text').val();
			identicon = generateIdenticon(customText + pk);
			break;
		}
	setIdenticon(identicon);
}

function signOut(){
	$('.not-logged-in').show();
	$('.loading-2').show();
	$('.logged-in').hide();
	$('.identitable').hide();
	$('#ar-address').hide();
	$('#ar-address').html();
	$('#custom-text').val('');
}

$('[name="identi"]').on('change', function() {
  if($(this).val() === "3") {
    $('#collapseTwo').collapse('show');
  } else {
    $('#collapseTwo').collapse('hide');
  }
  updateIdenticon();
});