# FrameLab — Textures animées pour Second Life

Un outil en français pour transformer une vidéo ou un GIF en texture animée **1024 × 1024 ou 2048 × 2048**, avec sélection des images et génération LSL. Aucun serveur de traitement, aucune clé API, aucune dépendance npm. Les médias restent dans le navigateur. Les polices Google sont facultatives ; des polices système prennent le relais hors ligne.

## Démarrage

Installer Node.js 20 ou supérieur, puis dans ce dossier :

```sh
npm start
```

Ouvrir http://127.0.0.1:4173. Ne pas ouvrir directement index.html via file:// (modules JavaScript).

## Utilisation

1. Choisir **Titre** ou **Démo**, puis importer une vidéo. Choisir début, fin et cadence d’extraction. Cliquer sur **Extraire les images**. L’exemple intégré permet de tester sans fichier.
2. Cliquer sur les vignettes pour inclure/exclure des images, ou utiliser les actions groupées.
   Pour **rogner / crop**, descendre sous les vignettes et dessiner un rectangle sur l’image. Le curseur « Image de référence » permet de choisir une autre frame pour cadrer. Les champs Gauche, Haut, Largeur et Hauteur permettent aussi un réglage au clavier. La zone s’applique à toute l’animation, à l’aperçu et au PNG ; la grille automatique est recalculée selon ses proportions. **Réinitialiser** restaure l’image entière. Titre et Démo gardent chacun leur cadrage. Une nouvelle extraction remet le cadrage à zéro ; aucune nouvelle extraction n’est nécessaire pour modifier le crop.
3. Régler les FPS de lecture, le sens, la résolution, le cadrage et les colonnes. L’aperçu respecte le cadrage de la texture. La cadence d’extraction et celle de lecture sont indépendantes.
4. Télécharger la texture PNG. Les images sont rangées de gauche à droite puis de haut en bas. Les cases inutilisées restent transparentes et sont exclues du nombre de frames LSL.
5. Importer la texture dans Second Life, copier son UUID et le saisir dans le champ correspondant. Faire de même pour l’autre animation si nécessaire.
6. Régler la prim et la face (par défaut 2 et 2, comme dans l’exemple). Pour un objet simple, utiliser **-4** (`LINK_THIS`). Pour toutes les faces, utiliser **-1** (`ALL_SIDES`).
7. Copier les fonctions `ftitre()` / `fdemo()` dans un script existant, ou télécharger le script complet dans un nouveau script LSL. Le script complet démarre sur Titre, ou Démo si elle seule est prête. Si les deux sont prêtes, un clic alterne entre elles.

Une prim ne peut jouer qu’une seule animation de texture à la fois. Pour animer Titre et Démo simultanément, utiliser deux prims et deux scripts avec leurs paramètres respectifs.

## Formats et limites

- Vidéos décodables par le navigateur : MP4 H.264 et WebM conseillés. MOV dépend du codec et du navigateur.
- GIF animé via l’API `ImageDecoder` : Chrome/Edge récents recommandés. Message explicite si indisponible. Tous les frames GIF sont extraits ; début/fin/cadence d’extraction concernent les vidéos. La vitesse GIF est ensuite uniformisée aux FPS choisis.
- Maximum 250 Mo par fichier et 256 images par animation. Réduire l’extrait ou les FPS pour les longues vidéos. Les images intermédiaires sont limitées à 512 px de côté pour maîtriser la mémoire : une cellule d’atlas plus grande n’ajoute pas de détails.
- Grilles en puissances de deux pour des cellules de taille entière. La sélection automatique privilégie le ratio de la source et limite les cases vides. « Image entière » conserve les proportions avec marges transparentes ; « Remplir » recadre.
- Pas d’export de fichier GIF animé : le résultat demandé pour SL est une planche PNG accompagnée de LSL.
- Les sessions ne sont pas sauvegardées : télécharger les textures et le script avant de fermer/recharger la page.
- Import SL et exécution en monde à vérifier avec votre objet. Une face inexistante n’affichera pas l’animation.

## Publier sur GitHub Pages

1. Créer un dépôt GitHub puis y envoyer les fichiers de ce dossier, y compris `.github/workflows/pages.yml`, sur la branche **main**.
2. Dans le dépôt : **Settings → Pages → Source → GitHub Actions**.
3. Dans **Actions**, attendre le workflow « Déployer sur GitHub Pages », ou le lancer manuellement avec **Run workflow**.
4. L’URL publiée figure dans **Settings → Pages**. Les chemins relatifs conviennent aussi à `https://pseudo.github.io/nom-du-depot/`.

Le workflow n’utilise aucun secret personnel. Tout hébergement statique HTTPS convient également : index.html, style.css, app.js et core.mjs suffisent.

## Vérification

```sh
npm test
```

Tests de calcul des grilles et de génération des scripts LSL. Validation manuelle conseillée : exemple, sélection, export dans chaque résolution ; vidéo avec un extrait non nul ; GIF ; deux UUID ; copier et télécharger le script.

## Références

- Inspiration fonctionnelle : https://www.mrmonke.net/AniGifToLSL — interface et code réécrits.
- LSL : https://create.secondlife.com/script/lsl-reference/functions/llsetlinktextureanim/
- Textures 2K : https://lindenlab.freshdesk.com/support/solutions/articles/31000173550-2024-materials-graphics-updates-faq
