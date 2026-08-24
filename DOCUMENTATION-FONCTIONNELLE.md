# Documentation fonctionnelle - Invitation Luc & Glenne

Application web d'invitation de mariage (mobile-first) permettant aux invités de confirmer leur présence, recevoir un QR code, laisser un mot doux, et aux organisateurs d'attribuer les tables pour le jour J.

**Événement :** Luc & Glenne - 4 décembre 2026

**Dépôt GitHub :** https://github.com/jesner14/wedding_Luc_-_Glenne

## 1. Objectif

- Informer les invités : page d'invitation (photos, infos, compte à rebours)
- Confirmer la présence : inscription et génération d'un QR code personnel
- Placer les invités : attribution de table par l'organisateur
- Accueillir le jour J : scan ou saisie de l'ID, puis affichage de la table
- Livre d'or : section Mots doux

## 2. Acteurs

**Invité**

Consulte l'invitation, confirme sa venue, télécharge son QR, laisse un message.

**Organisateur / Admin**

Consulte la liste des inscrits, attribue les numéros de table.

**Accueil (portail)**

Identifie l'invité (ID ou futur scan caméra) et indique sa table.

**Note actuelle :** il n'y a pas encore de connexion admin sécurisée. La gestion des invités est accessible depuis l'écran "Scanner un QR code", puis "Gérer la liste des invités".

## 3. Parcours global

1. Écran Invitation
2. Confirmer ma présence -> Inscription -> QR code
3. Scanner un QR code -> Accueil / Admin
4. Depuis Admin : Recherche par ID -> Affichage table
5. Depuis Admin : Gérer la liste -> Assigner table
6. Section Mots doux -> Envoyer ou lire les messages

## 4. Scénarios fonctionnels

### 4.1 Consulter l'invitation

**Acteur :** Invité

**Étapes :**

1. Ouvrir l'application (exemple : http://localhost:5173 en local).
2. Voir le carrousel de photos des mariés (défilement automatique et swipe).
3. Lire le compte à rebours jusqu'au 4 décembre 2026 à 14h00.
4. Consulter les informations type billet :
   - Mariage civil : Mairie d'Akanda - 14:00
   - Soirée : Pavillon Royal - 18:00
   - Date : 2026/12/04
   - Vol : LG041226
   - Thème : Raffiné Harmonieux
5. Faire défiler jusqu'à la galerie et aux mots doux.

**Résultat :** L'invité connaît le lieu, la date et le déroulement de l'événement.

### 4.2 Confirmer sa présence (RSVP)

**Acteur :** Invité

**Précondition :** Être sur l'écran d'invitation.

**Étapes :**

1. Appuyer sur "Confirmer ma présence".
2. Saisir son nom complet (tel qu'il sera utilisé pour l'accueil).
3. Valider "Obtenir mon QR code".

**Règles :**

- Le nom est obligatoire.
- Si le même nom (sans tenir compte des majuscules) est déjà enregistré, l'appli réaffiche le QR existant (pas de doublon).

**Résultat :**

- Un identifiant unique est créé (exemple : A3BC1D2E).
- L'invité est enregistré sans table pour le moment.
- L'écran QR code s'affiche.

### 4.3 Recevoir et conserver son QR code

**Acteur :** Invité

**Étapes :**

1. Après l'inscription, visualiser le QR code et l'identifiant.
2. Optionnel : appuyer sur "Télécharger mon QR code" pour sauvegarder l'image.
3. Revenir à l'invitation via "Retour à l'invitation".

**Contenu du QR :**

Le QR contient l'identifiant de l'invité (et des infos associées). Le numéro de table n'a pas besoin d'être figé dans l'image. Le jour J, l'appli retrouve l'invité par son ID et lit la table à jour.

**Résultat :** L'invité peut présenter son QR (ou son ID) à l'entrée.

### 4.4 Attribuer une table (organisateur)

**Acteur :** Organisateur

**Étapes :**

1. Depuis l'invitation, appuyer sur "Scanner un QR code".
2. Descendre et ouvrir "Gérer la liste des invités".
3. Voir pour chaque inscrit : le nom, l'identifiant, et la table (ou "Assigner table").
4. Saisir le numéro de table puis valider "OK".

**Résultat :** La table est enregistrée pour cet invité. Au prochain contrôle d'accueil, cette table sera affichée.

### 4.5 Accueil le jour J - retrouver la table

**Acteur :** Accueil / Organisateur

**Étapes :**

1. Ouvrir "Scanner un QR code".
2. Aujourd'hui : saisir manuellement l'identifiant de l'invité (affiché sur le QR ou l'écran invité).
3. Valider "Rechercher l'invité".

**Résultats possibles :**

- Invité trouvé et table assignée : affichage "Votre place est à la Table N".
- Invité trouvé sans table : message indiquant de se présenter à l'accueil.
- ID inconnu : message d'erreur.

**Caméra :** pour l'instant non branchée en web (saisie manuelle). Elle pourra être ajoutée plus tard (navigateur et HTTPS).

### 4.6 Laisser un mot doux

**Acteur :** Invité

**Étapes :**

1. Descendre jusqu'à la section "Mots doux".
2. Saisir son prénom et un message.
3. Appuyer sur "Envoyer".

**Résultat :**

- Confirmation visuelle : "Message envoyé au livre d'or".
- Le message apparaît dans la liste (nom et date).
- Le compteur de messages est mis à jour.

## 5. Écrans de l'application

**Invitation**

Contenu : photos, compte à rebours, infos billet, galerie, mots doux.  
Actions : RSVP, Scanner.

**Inscription**

Contenu : formulaire nom.  
Actions : Obtenir QR, Retour.

**QR code**

Contenu : QR et ID (et table si déjà connue).  
Actions : Télécharger, Retour.

**Scanner**

Contenu : zone scan (simulée), saisie ID, liste admin.  
Actions : Rechercher, Gérer invités.

**Table**

Contenu : bienvenue et numéro de table.  
Actions : Retour.

## 6. Données gérées (version actuelle)

Stockage local au navigateur (localStorage). Adapté aux tests. Pas encore partagé entre plusieurs téléphones.

### Invité

- id : identifiant unique (QR)
- name : nom saisi à l'inscription
- table : numéro de table (vide si non assigné)
- registeredAt : date et heure d'inscription

### Mot doux

- id : identifiant du message
- name : prénom de l'auteur
- text : contenu du message
- createdAt : date d'envoi

## 7. Limites actuelles et évolutions prévues

**Base de données**

- Aujourd'hui : localStorage (appareil seul)
- Plus tard : base partagée (exemple Supabase ou Firebase) en temps réel

**Admin**

- Aujourd'hui : accès libre via "Gérer la liste"
- Plus tard : page admin avec mot de passe

**Scan caméra**

- Aujourd'hui : non (saisie manuelle de l'ID)
- Plus tard : caméra web et lecture QR

**Multi-appareils**

- Aujourd'hui : non synchronisé
- Plus tard : oui, via la base

## 8. Démarrage local (rappel technique)

Commandes :

1. pnpm install
2. pnpm run dev

Puis ouvrir l'URL affichée (souvent http://localhost:5173).

## 9. Scénario de test recommandé (bout en bout)

1. Invité A confirme sa présence, note son ID, télécharge le QR.
2. Organisateur ouvre la liste et assigne la table 5 à Invité A.
3. Accueil saisit l'ID d'Invité A et vérifie l'affichage Table 5.
4. Invité B laisse un mot doux et vérifie qu'il apparaît dans la liste.
5. Recharger la page (même navigateur) et vérifier que les données sont toujours là.

Document basé sur le fonctionnement actuel de l'application Luc & Glenne.
