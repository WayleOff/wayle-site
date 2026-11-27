// Pages légales : confidentialité, cookies, CGU, CGV.
// Textes servis par défaut ; une page du même nom publiée depuis l'admin (Pages → « confidentialite », « cookies », « cgu », « cgv ») les remplace.
// Ce ne sont pas des conseils juridiques : à relire avec un professionnel du droit en cas de doute.

export const LEGAL = {
  maj: "27 novembre 2026",
  nom: "Jonas Deschamps",
  commercial: "Wayle Production",
  siret: "983 151 820 00021",
  adresse: "6E Rue Pillore, 76000 Rouen",
  tel: "07 86 85 81 14",
  email: "waylecorp@gmail.com",
  /* Médiateur de la consommation (obligatoire pour vendre à des particuliers).
     À renseigner dès que le contrat est signé : { nom: "…", adresse: "…", site: "https://…" }.
     Tant que c'est null, la section n'est pas affichée (aucun texte provisoire n'est publié). */
  mediateur: null,
};

const T = (text, lead) => ({ t: "title", text, ...(lead ? { lead } : {}) });
const P = (text) => ({ t: "text", text });
const mail = `[${LEGAL.email}](mailto:${LEGAL.email})`;

/* ------------------------------------------------------------------ Confidentialité */
export function confidentialiteFallback() {
  return {
    title: "Politique de confidentialité",
    desc: `Quelles données ${LEGAL.commercial} collecte, pourquoi, combien de temps, et comment exercer vos droits. Dernière mise à jour : ${LEGAL.maj}.`,
    blocks: [
      T("Qui est responsable de vos données"),
      P(`**${LEGAL.commercial}**, entreprise individuelle de ${LEGAL.nom}, SIRET ${LEGAL.siret}, ${LEGAL.adresse}.\n\nPour toute question sur vos données : ${mail} ou ${LEGAL.tel}. Il n'y a pas de délégué à la protection des données ; vous écrivez directement à l'éditeur.`),
      T("Ce que nous collectons, pourquoi, et pendant combien de temps"),
      P(`**1. Le formulaire de contact** (page d'accueil)\n\n- Données : nom, adresse e-mail, type de projet, message, et facultativement téléphone et créneau de rappel.\n- Pourquoi : répondre à votre demande et, si vous le souhaitez, vous faire une proposition. Base légale : vos démarches avant un éventuel contrat (art. 6.1.b du RGPD).\n- Durée : le temps de traiter votre demande, puis au maximum **3 ans après notre dernier échange** si aucun contrat n'a suivi.`),
      P(`**2. Les actualités par e-mail** (case facultative, jamais cochée d'office)\n\n- Si vous cochez la case du formulaire, nous pouvons vous écrire pour vous donner des nouvelles et des offres de ${LEGAL.commercial}. Base légale : votre consentement (art. 6.1.a).\n- Vous pouvez le retirer à tout moment, par un lien de désinscription ou en écrivant à ${mail}. Retirer votre accord n'a aucun effet sur le traitement de votre demande.\n- Durée : jusqu'au retrait de votre accord, et au plus 3 ans sans échange avec vous.`),
      P(`**3. Nos clients** (devis, factures, espace client)\n\n- Données : identité et coordonnées, informations du projet, devis, factures, paiements, messages et validations échangés dans l'espace client. Votre code d'accès personnel n'est conservé que sous forme d'empreinte chiffrée.\n- Pourquoi : exécuter le contrat, facturer, vous livrer. Base légale : le contrat (art. 6.1.b) et nos obligations comptables (art. 6.1.c).\n- Durée : la durée du contrat, puis **10 ans** pour les pièces comptables (factures), comme la loi l'exige. Les autres données sont supprimées 3 ans après la fin de la relation.`),
      P(`**4. La prospection auprès de professionnels**\n\nNous contactons des entreprises (restaurants, commerces, artistes, sociétés) dont les coordonnées professionnelles sont publiques : site internet, fiche Google, réseaux sociaux, annuaires. Nous gardons le nom de l'établissement, la personne à contacter si elle est publique, ses coordonnées professionnelles et nos échanges.\n\n- Pourquoi : proposer nos services. Base légale : notre intérêt légitime à développer notre activité (art. 6.1.f), pour des offres en lien avec votre activité professionnelle.\n- Vous êtes informé à notre premier message. Vous pouvez vous opposer à tout moment, sans motif : écrivez-nous et nous ne vous recontactons plus.\n- Durée : 3 ans à partir du dernier contact avec vous.`),
      P(`**5. Les journaux techniques**\n\nComme tout site, les serveurs de notre hébergeur enregistrent l'adresse IP et la date des visites, pour la sécurité du site et contre les attaques (intérêt légitime, art. 6.1.f). Ces journaux sont conservés par l'hébergeur pour une durée courte. Nous ne les utilisons pas pour mesurer ou profiler les visiteurs.`),
      T("Ce que nous ne faisons pas"),
      P(`- Pas de publicité ciblée, pas de réseau publicitaire, pas de mesure d'audience, pas de pixel de suivi.\n- Pas de vente ni de location de vos données.\n- Pas de décision automatisée vous concernant.\n\nDétail des traceurs sur la page [Cookies](/cookies).`),
      T("Qui reçoit vos données"),
      P(`Seul ${LEGAL.commercial} lit vos données. Pour faire fonctionner le site et nos outils, nous faisons appel à des prestataires, qui n'agissent que sur nos instructions :\n\n- **Cloudflare, Inc.** (États-Unis) : hébergement du site, base de données et fichiers, protection contre les attaques.\n- **Web3Forms** (Web3Creative, Inde) : transmet par e-mail les messages envoyés depuis le formulaire de contact. Il peut en conserver une copie technique jusqu'à 3 ans.\n- **Google** (messagerie Gmail) : réception de vos messages et de nos réponses.\n- **Vercel et Supabase** : hébergement et base de données de notre outil interne de suivi commercial.\n- **Anthropic** : assistant d'analyse utilisé dans cet outil interne, uniquement sur des informations professionnelles publiques.\n\nLes liens vers Instagram, YouTube ou Vimeo vous font quitter ce site : ces services appliquent alors leur propre politique.`),
      T("Transferts hors de l'Union européenne"),
      P(`Certains prestataires sont situés hors de l'Union européenne (États-Unis, Inde). Ces transferts sont encadrés par les mécanismes prévus par le RGPD : clauses contractuelles types de la Commission européenne, et, pour les entreprises américaines qui en font partie, le cadre de protection des données UE–États-Unis. Pour en savoir plus, écrivez-nous.`),
      T("Vos droits"),
      P(`Vous pouvez à tout moment demander :\n\n- l'**accès** à vos données et une copie ;\n- la **rectification** de ce qui est inexact ;\n- l'**effacement** de vos données ;\n- la **limitation** de leur traitement ;\n- la **portabilité** de celles que vous nous avez fournies ;\n- l'**opposition** à leur utilisation, notamment pour la prospection (sans avoir à vous justifier) ;\n- le **retrait de votre consentement**, quand le traitement repose dessus ;\n- des directives sur le sort de vos données après votre décès.\n\nÉcrivez à ${mail}. Nous répondons **sous un mois**. En cas de doute sur votre identité, nous pouvons vous demander un justificatif.`),
      T("Réclamation"),
      P(`Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la **CNIL** : [cnil.fr/plaintes](https://www.cnil.fr/fr/plaintes), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07. Nous vous invitons à nous écrire d'abord : nous préférons régler le problème directement.`),
      T("Sécurité"),
      P(`Le site est servi en HTTPS ; l'espace d'administration est protégé par une authentification ; les codes d'accès clients ne sont pas stockés en clair ; les accès sont limités à l'éditeur. Aucun système n'est infaillible : en cas de fuite de données qui présenterait un risque pour vous, nous vous en informons et prévenons la CNIL dans les délais légaux.`),
      T("Modifications"),
      P(`Cette politique peut évoluer. La date de dernière mise à jour figure en haut de cette page : ${LEGAL.maj}.`),
    ],
  };
}

/* ------------------------------------------------------------------ Cookies */
export function cookiesFallback() {
  return {
    title: "Cookies et traceurs",
    desc: `Ce que ce site dépose dans votre navigateur, et pourquoi il n'affiche pas de bandeau. Dernière mise à jour : ${LEGAL.maj}.`,
    blocks: [
      T("En bref"),
      P(`Ce site **n'utilise aucun cookie publicitaire, aucun outil de mesure d'audience et aucun réseau social intégré**. Les seuls éléments stockés sont techniques et nécessaires au fonctionnement du site. La loi les dispense de votre consentement : c'est pourquoi **il n'y a pas de bandeau de cookies**, et pas de bouton « tout accepter » à cliquer.`),
      T("Ce qui est stocké dans votre navigateur"),
      P(`- **Mémoire de session** (sessionStorage) : retient pendant la visite, dans l'onglet ouvert, si l'animation d'ouverture a déjà été vue, et, si vous utilisez l'espace client, votre code d'accès pour ne pas le retaper à chaque page. Cela disparaît à la fermeture de l'onglet. Finalité : fonctionnement du site à votre demande.\n- **Sécurité de l'hébergeur** (Cloudflare) : des cookies techniques peuvent être déposés pour distinguer un visiteur d'un robot malveillant, ou, pour l'espace d'administration réservé à l'éditeur, pour l'authentification. Ils ne servent pas au suivi.`),
      T("Les vidéos YouTube et Vimeo"),
      P(`Certaines pages peuvent contenir une vidéo hébergée par YouTube (Google) ou Vimeo. Elle ne se charge **qu'au moment où vous cliquez** sur « Lire la vidéo » : tant que vous ne cliquez pas, aucune donnée n'est envoyée à ces services. Après votre clic, ils peuvent déposer leurs propres traceurs, selon leur politique. Les vidéos de nos réalisations sont hébergées par ce site et ne déposent rien.`),
      T("Polices de caractères"),
      P(`Les polices sont hébergées sur ce site. Aucune connexion à Google Fonts ni à un autre service de polices n'a lieu quand vous visitez nos pages.`),
      T("Pourquoi pas de bandeau"),
      P(`Le consentement n'est obligatoire que pour les traceurs qui ne sont pas indispensables au service demandé (publicité, mesure d'audience non exemptée, réseaux sociaux). Le site n'en utilise aucun. Si nous en ajoutons un à l'avenir, un bandeau vous demandera votre accord **avant** tout dépôt, avec un bouton « Refuser » aussi simple que « Accepter », et cette page sera mise à jour.`),
      T("Gérer ou effacer ce qui est stocké"),
      P(`Vous pouvez à tout moment supprimer les données de session et les cookies depuis les réglages de votre navigateur, ou le configurer pour les bloquer. Le site fonctionne sans, mais l'espace client vous redemandera votre code à chaque visite.\n\nPour en savoir plus sur vos droits : [cnil.fr/cookies](https://www.cnil.fr/fr/cookies-et-autres-traceurs). Nos pratiques sur les données personnelles sont détaillées dans la [politique de confidentialité](/confidentialite).`),
    ],
  };
}

/* ------------------------------------------------------------------ CGU */
export function cguFallback() {
  return {
    title: "Conditions d'utilisation du site",
    desc: `Règles d'utilisation du site wayle.fr et de l'espace client. Dernière mise à jour : ${LEGAL.maj}.`,
    blocks: [
      T("Objet"),
      P(`Ces conditions encadrent l'utilisation du site **wayle.fr** (« le site »), édité par ${LEGAL.commercial} (voir les [mentions légales](/mentions-legales.html)). En naviguant sur le site, vous les acceptez. Elles ne remplacent pas les [conditions générales de vente](/cgv), qui s'appliquent à nos prestations.`),
      T("Accès au site"),
      P(`Le site est accessible gratuitement, sans inscription. Nous faisons le nécessaire pour qu'il soit disponible en continu, sans pouvoir le garantir : une maintenance, une panne ou un incident chez l'hébergeur peuvent l'interrompre sans préavis. Vous gardez à votre charge votre connexion et votre matériel.`),
      T("Espace client"),
      P(`L'espace client est réservé aux clients de ${LEGAL.commercial}. L'accès se fait avec un **code personnel** remis par ${LEGAL.commercial}.\n\n- Gardez ce code confidentiel et ne le partagez pas, sauf avec les personnes de votre entreprise concernées par le projet. Vous êtes responsable de l'usage qui en est fait.\n- Si vous pensez que votre code a été vu par un tiers, prévenez-nous : nous le remplaçons.\n- Il est interdit d'essayer d'accéder aux informations d'un autre client, de deviner des codes, de perturber le service ou de tester sa sécurité sans autorisation écrite.\n- Nous pouvons suspendre un accès en cas d'usage abusif.`),
      T("Propriété intellectuelle"),
      P(`Les textes, images, vidéos, musiques, logos et la mise en page du site appartiennent à ${LEGAL.commercial} ou à leurs auteurs, et sont protégés par le Code de la propriété intellectuelle. Toute reproduction, diffusion ou réutilisation, même partielle, sans autorisation écrite est interdite.\n\nLes clips et vidéos présentés en références restent la propriété de leurs auteurs et ayants droit, et sont montrés avec leur accord. Si vous estimez qu'un contenu porte atteinte à vos droits, écrivez-nous : ${mail}.\n\nLes livrables d'un projet sont régis par le contrat conclu avec le client (voir les conditions générales de vente), non par ces conditions.`),
      T("Votre usage du formulaire de contact"),
      P(`Le formulaire sert à nous écrire à propos d'un projet. Merci de n'y indiquer que des informations exactes, vous concernant ou concernant l'entreprise que vous représentez, et de ne pas l'utiliser pour envoyer des contenus illicites, des messages publicitaires non sollicités ou des tentatives d'intrusion. Le traitement de vos données est décrit dans la [politique de confidentialité](/confidentialite).`),
      T("Liens externes"),
      P(`Le site contient des liens vers des sites tiers (Instagram, YouTube, Vimeo, portfolios). Nous ne contrôlons pas leur contenu et déclinons toute responsabilité à leur égard.`),
      T("Responsabilité"),
      P(`Nous nous efforçons de publier des informations exactes et à jour, sans garantie d'exhaustivité. Les tarifs affichés sont indicatifs ; seul le devis accepté engage ${LEGAL.commercial}. Nous ne sommes pas responsables des dommages indirects liés à l'usage du site, dans la limite permise par la loi. Rien dans ces conditions ne limite les droits que la loi vous reconnaît en tant que consommateur.`),
      T("Modification des conditions"),
      P(`Nous pouvons modifier ces conditions ; la version applicable est celle publiée sur cette page à la date de votre visite.`),
      T("Droit applicable"),
      P(`Ces conditions sont soumises au droit français. Pour un litige avec un professionnel, les tribunaux de Rouen sont compétents. Si vous êtes consommateur, vous pouvez saisir le tribunal de votre domicile ou un médiateur de la consommation (voir les conditions générales de vente).`),
    ],
  };
}

/* ------------------------------------------------------------------ CGV */
function mediation() {
  const m = LEGAL.mediateur;
  if (!m || !m.nom) return [];
  return [
    T("Médiation de la consommation"),
    P(`Si vous êtes consommateur et qu'un litige persiste après une réclamation écrite adressée à ${mail}, vous pouvez saisir gratuitement le médiateur de la consommation dont nous relevons :\n\n**${m.nom}**${m.adresse ? `\n${m.adresse}` : ""}${m.site ? `\n[${m.site.replace(/^https?:\/\//, "")}](${m.site})` : ""}\n\nVous pouvez aussi utiliser la plateforme européenne de règlement en ligne des litiges : [ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr).`),
  ];
}

export function cgvFallback() {
  return {
    title: "Conditions générales de vente",
    desc: `Les conditions applicables aux prestations de ${LEGAL.commercial} : devis, acompte, livraison, droits sur les vidéos, rétractation et remboursement. Dernière mise à jour : ${LEGAL.maj}.`,
    blocks: [
      T("1. Qui vend, et à qui"),
      P(`Ces conditions s'appliquent à toutes les prestations de création vidéo et photo, de production de contenus et d'accompagnement sur les réseaux et la fiche Google vendues par **${LEGAL.commercial}**, entreprise individuelle de ${LEGAL.nom}, SIRET ${LEGAL.siret}, ${LEGAL.adresse}, ${LEGAL.email}, ${LEGAL.tel}. TVA non applicable, art. 293 B du CGI.\n\nElles s'adressent aux **professionnels** (entreprises, artistes, commerces, associations) et aux **particuliers** (« consommateurs »). Les articles réservés aux consommateurs sont signalés. Le devis signé et ces conditions forment le contrat ; en cas de contradiction, le devis l'emporte.`),
      T("2. Devis et commande"),
      P(`Chaque projet fait l'objet d'un devis gratuit, valable **30 jours** sauf mention contraire. Les tarifs affichés sur le site sont indicatifs, exprimés « à partir de » et **TTC** (TVA non applicable). La commande est ferme à la signature du devis, sur papier ou par voie électronique, ou à son acceptation écrite par e-mail.\n\nToute demande qui change le contenu du devis (durée, lieux, options, nombre de versions) fait l'objet d'un devis modificatif accepté avant sa réalisation.`),
      T("3. Prix et paiement"),
      P(`- **Acompte de 30 %** du prix total à la commande. Le tournage et le travail démarrent à réception de l'acompte (voir l'article 8 pour les ventes hors établissement).\n- **Solde** facturé à la livraison, payable sous **30 jours** au plus tard à compter de la facture.\n- Moyens de paiement : virement bancaire, et tout autre moyen accepté sur la facture.\n- Prestations mensuelles (suivi de fiche Google, publications) : facturées mensuellement, au début de chaque mois, sauf mention contraire sur le devis.\n- **Retard de paiement**, client professionnel : pénalités au taux de trois fois le taux d'intérêt légal, exigibles sans rappel, et indemnité forfaitaire de **40 €** pour frais de recouvrement (art. L441-10 et D441-5 du Code de commerce). Client consommateur : intérêts au taux légal après mise en demeure.\n- Jusqu'au paiement complet, les droits d'utilisation des livrables ne sont pas cédés (article 6).`),
      T("4. Réalisation et livraison"),
      P(`${LEGAL.commercial} s'engage à réaliser la prestation avec soin et selon les règles de l'art (obligation de moyens). Les dates de tournage et de livraison sont convenues au devis ; un délai de livraison est indicatif, sauf engagement exprès. La livraison se fait par lien de téléchargement ou via l'espace client.\n\nLe client fournit à temps les informations, accès, lieux, personnes, produits, musiques et validations nécessaires. Les retards qui en découlent décalent d'autant la livraison. Le **nombre de séries de retouches** compris est précisé au devis ; à défaut, il est de **deux**. Les retouches au-delà peuvent être facturées sur devis.\n\nLe client vérifie la livraison et signale tout défaut par écrit **sous 14 jours**. Faute de retour dans ce délai, la livraison est réputée conforme, sans préjudice des garanties légales dues aux consommateurs.`),
      T("5. Annulation, report et force majeure"),
      P(`- **Report d'un tournage** : le client prévient au moins **48 heures** avant ; un nouveau créneau est proposé. Moins de 48 heures avant, ou en cas d'absence sur place, le déplacement peut être facturé.\n- **Annulation après commande**, hors droit de rétractation (article 8) : l'acompte versé reste acquis à ${LEGAL.commercial} à hauteur du travail et des frais déjà engagés ; l'éventuel surplus est remboursé.\n- **Force majeure** (maladie, accident, intempérie qui rend le tournage impossible, panne de matériel, événement imprévisible et irrésistible) : la prestation est reportée sans pénalité. Si le report est impossible, les sommes versées pour la partie non réalisée sont remboursées.\n- **Prestations mensuelles** : sans engagement de durée sauf mention au devis ; chaque partie peut y mettre fin avec un préavis de **30 jours** par écrit.`),
      T("6. Propriété intellectuelle et droits sur les vidéos"),
      P(`- Les livrables finaux (vidéos, photos, montages) sont protégés par le droit d'auteur. **À réception du paiement complet**, ${LEGAL.commercial} cède au client le droit de les reproduire et de les diffuser, pour les usages et supports prévus au devis, sans limite de durée, dans le monde entier. Tout autre usage fait l'objet d'un accord écrit.\n- Les rushes, projets de montage et fichiers sources restent la propriété de ${LEGAL.commercial} et ne sont pas livrés, sauf accord écrit.\n- ${LEGAL.commercial} peut présenter les réalisations dans son portfolio, sur son site et ses réseaux, sauf opposition écrite du client avant la livraison.\n- Le client garantit disposer des droits sur les éléments qu'il fournit (logos, musiques, textes, images) et des autorisations des personnes et lieux filmés qu'il a choisis. ${LEGAL.commercial} recueille les autorisations de droit à l'image des personnes qu'il filme de sa propre initiative.\n- ${LEGAL.commercial} conserve une copie des livrables **12 mois** après la livraison, sans obligation d'archivage au-delà : le client est invité à sauvegarder les fichiers livrés.`),
      T("7. Responsabilité"),
      P(`La responsabilité de ${LEGAL.commercial} est limitée aux dommages directs et prévisibles, et, pour un client professionnel, au montant payé pour la prestation concernée. ${LEGAL.commercial} n'est pas responsable de l'usage que le client fait des livrables, ni des résultats commerciaux ou des audiences obtenus : ils dépendent de facteurs extérieurs à la prestation. Rien ici ne limite la responsabilité qui ne peut l'être par la loi, ni les garanties légales dues aux consommateurs.`),
      T("8. Droit de rétractation (consommateurs)"),
      P(`**Vente à distance ou hors établissement.** Quand le contrat est conclu à distance (internet, téléphone, e-mail) ou hors de nos locaux (par exemple lors d'un rendez-vous chez vous), le consommateur dispose de **14 jours** pour se rétracter, sans avoir à se justifier, à compter de la conclusion du contrat. Le même droit s'étend aux très petites entreprises (5 salariés au plus) qui signent hors établissement un contrat qui n'entre pas dans le champ de leur activité principale.\n\n**Comment faire.** Notifiez votre décision par une déclaration sans ambiguïté, par e-mail à ${mail} ou par courrier à ${LEGAL.adresse}. Vous pouvez utiliser le modèle ci-dessous, sans obligation. Il suffit d'envoyer votre demande avant la fin du délai.\n\n**Début de la prestation pendant le délai.** Si vous demandez expressément que la prestation commence avant la fin des 14 jours, vous payez une somme proportionnelle à ce qui a été fourni jusqu'à votre rétractation. Si la prestation est **entièrement exécutée** avant la fin du délai, avec votre accord préalable exprès et après que vous avez reconnu perdre votre droit de rétractation, vous ne pouvez plus vous rétracter.\n\n**Contrats conclus hors établissement.** Aucun paiement, acompte compris, n'est demandé ni accepté avant l'expiration d'un délai de **7 jours** après la conclusion du contrat (art. L221-10 du Code de la consommation). Cette règle s'applique aussi aux très petites entreprises citées ci-dessus.\n\n**Remboursement.** Si vous vous rétractez, nous vous remboursons toutes les sommes versées, dans un délai maximum de **14 jours** à compter de la réception de votre décision, par le même moyen de paiement, sans frais pour vous, sous déduction de la somme proportionnelle due si la prestation avait commencé à votre demande.\n\nLes clients professionnels ne disposent pas de droit de rétractation légal, sauf dans le cas des petites entreprises cité plus haut.`),
      T("Modèle de formulaire de rétractation", "À remplir et à renvoyer uniquement si vous souhaitez vous rétracter du contrat."),
      P(`À l'attention de ${LEGAL.commercial}, ${LEGAL.adresse}, ${LEGAL.email} :\n\nJe vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous :\n\n- Commandé le : ………………………………\n- Prestation : ………………………………\n- Nom du consommateur : ………………………………\n- Adresse du consommateur : ………………………………\n- Date : ………………………………\n- Signature (uniquement en cas de notification sur papier) : ………………………………`),
      T("9. Garanties légales (consommateurs)"),
      P(`Le consommateur bénéficie des garanties légales qui s'appliquent à sa commande, notamment la garantie légale de conformité et la garantie contre les vices cachés. Ces conditions ne les excluent pas : en cas de défaut de conformité, il peut demander la mise en conformité de la prestation ou, à défaut, une réduction du prix ou la résolution du contrat.`),
      T("10. Données personnelles"),
      P(`Les données collectées pour le devis et la prestation sont traitées comme indiqué dans la [politique de confidentialité](/confidentialite).`),
      ...mediation(),
      T("Droit applicable et litiges"),
      P(`Le contrat est soumis au droit français. En cas de difficulté, nous cherchons d'abord une solution amiable : écrivez-nous à ${mail}. À défaut, pour un client professionnel, les tribunaux de Rouen sont seuls compétents. Un consommateur peut saisir le tribunal de son domicile, dans les conditions prévues par la loi.`),
    ],
  };
}
