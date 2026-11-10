# VBCF Muscu

Appli de musculation par poste des joueuses N2F du **Volley Ball Cœur de Flandre**.
Elle s'installe sur iPhone depuis Safari, s'ouvre en plein écran et fonctionne sans réseau.

## Ce que fait l'appli

- **Au premier lancement**, la joueuse choisit son poste : Centraux, Récep/Att & Pointu, Passeur ou Libéro.
- **Ma séance** montre l'échauffement, les supersets A et B et les options conseillées pour son poste.
- **Séance guidée** : l'appli enchaîne les exercices, compte les tours et lance le chrono de repos (avec un bip à la fin).
  - La fin de séance propose une option.
  - La séance est enregistrée dans l'historique.
  - Une séance interrompue peut être reprise plus tard.
- **Fiche exercice** : schéma, dosage, consignes, erreur à éviter et lien vidéo.
- **Options** : les 4 options, avec le tableau par poste.
- **Profil** : changement de poste, historique, aide à l'installation et numéro de version.

L'historique est enregistré **sur le téléphone de chaque joueuse**. Il n'y a ni compte ni serveur.

## Mise en ligne (GitHub Pages)

1. Sur GitHub, crée un dépôt public nommé `vbcf-muscu`.
2. Dépose **tout le contenu du dossier** à la racine du dépôt, en gardant le dossier `icons/` (« Add file » → « Upload files »).
3. Va dans **Settings → Pages**, puis choisis Source : *Deploy from a branch*, Branch : `main`, dossier `/ (root)`, et Save.
4. Une à deux minutes plus tard, l'appli est en ligne à cette adresse :
   `https://sylvaindeblock59-sketch.github.io/vbcf-muscu/`

## Installation sur l'iPhone des joueuses

1. Ouvrir le lien dans **Safari**. Chrome sur iPhone ne permet pas l'installation.
2. Toucher **Partager**, puis **« Sur l'écran d'accueil »**, puis **Ajouter**.
3. L'icône VBCF apparaît sur l'écran d'accueil.

## Faire évoluer l'appli

| Je veux… | Fichier à modifier |
|---|---|
| Changer un exercice, une dose, une consigne, une vidéo | `programme.json` |
| Changer le programme d'un poste ou une option | `programme.json` |
| Changer l'affichage ou ajouter une fonction | `app.js` / `styles.css` |
| **Publier la mise à jour** | `version.js` : augmenter le numéro (ex. `1.0.0` → `1.0.1`) |

**Important : il faut augmenter `version.js` à chaque mise en ligne.** C'est ce qui affiche « Nouvelle version disponible » sur les téléphones et renouvelle le stockage hors-ligne.

### Repères dans `programme.json`

- `exercices` : le catalogue. Chaque exercice a un identifiant (ex. `squat`) avec son nom, son objectif, ses consignes, son erreur à éviter, sa vidéo et son schéma.
- `postes[].supersets[].exercices` : renvoie au catalogue par `id`, avec le `dosage` propre au poste.
- `options` et `matrice_options` : les options et leur niveau de conseil par poste. L'ordre suit les options 1 à 4.
- `version_contenu` : la date affichée dans Profil.

Après une modification, vérifie que le fichier est toujours valide (par exemple sur jsonlint.com) avant de le déposer.

## Technique

- JavaScript ES5 sans bibliothèque, pour la compatibilité Safari iOS.
- `sw.js` : service worker. Il va d'abord chercher la dernière version sur le réseau et se replie sur la copie hors-ligne quand il n'y a pas de connexion.
- `manifest.webmanifest` et `icons/` : nom, icône et affichage plein écran.
