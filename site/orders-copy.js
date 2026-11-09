(() => {
  const rows=[
    ['Bakronde','Baking round','Fournée'],['Wijzigingen annuleren','Discard changes','Annuler les modifications'],
    ['Voorraad','Stock','Stock'],['Orders','Orders','Commandes'],['Order ingeven','Enter order','Saisir une commande'],
    ['Opslaan vermindert de voorraad. Vul eerst getelde, beschikbare voorraad in.','Saving deducts stock. Enter counted, available stock first.','L’enregistrement déduit le stock. Saisissez d’abord le stock compté et disponible.'],
    ['Klantnaam','Customer name','Nom du client'],['Order opslaan','Save order','Enregistrer la commande'],
    ['Aantal','Quantity','Quantité'],['Stukprijs (€)','Unit price (€)','Prix unitaire (€)'],['Totaal','Total','Total'],
    ['Nog geen orders.','No orders yet.','Aucune commande.'],['Geannuleerd','Cancelled','Annulée'],
    ['Klantlabel','Customer label','Étiquette client'],['Intern label','Internal label','Étiquette interne'],
    ['CSV voor Brother','CSV for Brother','CSV pour Brother'],['Aanpassen','Edit','Modifier'],['Order annuleren','Cancel order','Annuler la commande'],
    ['Order annuleren en de voorraad terugzetten?','Cancel the order and restore stock?','Annuler la commande et rétablir le stock ?'],
    ['Order opgeslagen.','Order saved.','Commande enregistrée.'],['Kies minstens één artikel.','Choose at least one item.','Choisissez au moins un article.'],
    ['Vul eerst een getelde voorraad in voor deze artikelen.','Enter counted stock for these items first.','Saisissez d’abord le stock compté pour ces articles.'],
    ['Onvoldoende beschikbare voorraad voor deze order.','Insufficient available stock for this order.','Stock disponible insuffisant pour cette commande.'],
    ['Controleer klantnaam, artikelen, aantallen en prijzen.','Check customer name, items, quantities and prices.','Vérifiez le nom du client, les articles, les quantités et les prix.'],
    ['Het label kon niet worden geopend. Sta browseropslag en pop-ups toe.','Could not open the label. Allow browser storage and pop-ups.','Impossible d’ouvrir l’étiquette. Autorisez le stockage du navigateur et les fenêtres contextuelles.'],
    ['QL-700 · USB · 62 mm. Kies in Windows dezelfde rolbreedte, schaal 100%, geen kop- of voettekst en automatisch afsnijden in de printerinstellingen. CSV is bedoeld voor een sjabloon in P-touch Editor.','QL-700 · USB · 62 mm. In Windows select the same roll width, 100% scale, no headers or footers and automatic cutting in printer settings. CSV is for a template in P-touch Editor.','QL-700 · USB · 62 mm. Dans Windows, choisissez la même largeur, une échelle de 100 %, sans en-tête ni pied de page et la coupe automatique dans les paramètres de l’imprimante. Le CSV sert à un modèle dans P-touch Editor.']
  ];
  rows.forEach((row,index)=>{const key='orderCopy'+index;KMCTranslations.copy[key]=row;KMCTranslations.dynamic[row[0]]=row.slice(1);
    document.querySelectorAll('button,legend,h2,p,label>span').forEach(e=>{if(!e.dataset.i18n && e.textContent===row[0])e.dataset.i18n=key;});
  });
})();
