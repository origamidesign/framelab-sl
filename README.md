# FrameLab — Textures animées pour Second Life

Site statique en français : vidéo ou GIF → sélection des frames → crop → texture PNG 1024/2048 → script LSL. Traitement dans le navigateur, sans envoi des médias ni dépendance npm. Aperçu **2D uniquement** ; aucun modèle 3D n’est inclus.

## Dossier à utiliser

Le seul dossier du dépôt est **`D:\Sauvegarde\OpenAI\Projets\GIF SL\framelab-sl`**. Ne pas créer un second `framelab-sl` à l’intérieur et ne pas supprimer son `.git`.

## Publier avec GitHub Desktop

1. Sélectionner ce dépôt. Si nécessaire : File → Add Local Repository, puis sélectionner le dossier ci-dessus.
2. Summary : **Restauration du site sans 3D**. Cliquer sur **Commit to main**, puis **Push origin**.
3. Sur GitHub : **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
4. Attendre le déploiement, puis ouvrir https://origamidesign.github.io/framelab-sl/ et recharger avec Ctrl + F5.

Pas de workflow Actions personnalisé nécessaire. Pour un autre hébergement statique, publier index.html, style.css, app.js, core.mjs et assets/.

## Utilisation

1. Choisir Titre ou Démo. Importer une vidéo et régler les FPS d’extraction, puis **Extraire toute la vidéo**. Toute la durée est utilisée. Sans média chargé, le bouton ouvre le choix de fichier. L’exemple intégré permet un essai sans vidéo.
2. Dessiner un crop. Glisser son intérieur pour le déplacer ; tirer les bords ou les huit poignées pour le redimensionner. Les pourcentages permettent un réglage au clavier. Le curseur choisit l’image de référence. Réinitialiser restaure l’image entière. Le crop s’applique à toutes les images et reste conservé après un changement de FPS, une nouvelle extraction, un remplacement de vidéo ou le chargement de l’exemple. Seul Réinitialiser l’efface. Les coordonnées sont proportionnelles à l’image et Titre/Démo gardent chacun leur cadre. Le rechargement de la page ferme la session.
3. Cliquer sur les vignettes pour les conserver/exclure ou utiliser les actions groupées. Le curseur « Taille des vignettes » agrandit leur affichage (82 à 240 px), sans modifier la texture exportée. Une image réactivée est affichée en pause pour l’examiner.
L’aperçu est placé à droite de la galerie sur ordinateur et reste visible pendant le défilement. Son numéro indique la vignette d’origine ; le compteur indique la position dans la séquence conservée. Le contour bleu clair identifie l’image affichée. La barre horizontale et les boutons Précédente/Suivante permettent de parcourir la sélection, y compris en sens inversé et en aller-retour. Une navigation manuelle met en pause ; Lecture reprend à cet endroit. Sur mobile, l’aperçu est placé juste avant la galerie, qui défile dans sa propre zone.

4. Régler les FPS de lecture (indépendants de l’extraction), le sens, la résolution et les colonnes. Chaque onglet conserve ses images, sa sélection et ses réglages.
5. Télécharger le PNG. Le mode par défaut **Second Life — sans marges** étire toute la zone cadrée dans chaque cellule : pas de marges ajoutées ni de perte par recadrage. Dans SL, utiliser une face aux proportions de la source/crop (par exemple 4:3). Les deux autres modes ajoutent des marges ou recadrent. Les bandes et transparences déjà présentes dans la source restent présentes : les enlever avec le crop si nécessaire.
6. Importer les PNG dans SL et saisir les UUID correspondants. Régler la prim et la face ; par défaut 2 et 2. Pour une prim simple : **-4** (`LINK_THIS`). Toutes les faces : **-1** (`ALL_SIDES`).
7. Copier les fonctions `ftitre()`/`fdemo()` dans un script existant, ou télécharger le script complet. Celui-ci démarre sur Titre (ou Démo si elle seule est prête) et un clic alterne si les deux animations sont prêtes.

Une prim ne joue qu’une animation de texture à la fois. Les images de l’atlas sont rangées de gauche à droite puis de haut en bas. Les cases vides sont exclues du nombre de frames du script.

## Limites

- 250 Mo par fichier, 256 images par animation. Si la vidéo entière dépasse 256 images, un message propose les FPS maximum ; pas de découpe silencieuse. Valeurs décimales acceptées (0,01 à 60).
- Vidéos selon les codecs du navigateur (MP4 H.264/WebM conseillés). GIF via ImageDecoder dans Chrome/Edge récents : toutes les frames sont extraites, puis jouées à cadence uniforme.
- Images intermédiaires limitées à 512 px de côté pour la mémoire. Une cellule plus grande n’ajoute pas de détails.
- Aucun enregistrement de session : exporter avant de recharger ou fermer.
- Résultat pour SL : une planche PNG et du LSL, pas un fichier GIF animé.
- Polices Google facultatives ; polices système de remplacement. Le décor respecte la préférence de réduction des animations.

## En local et tests

Node.js 20+ : `npm start` ou `node server.mjs`, puis http://127.0.0.1:4173. Ne pas ouvrir index.html directement via file://.

Tests : `npm test` ou `node --test tests/*.test.mjs`. Ils vérifient grilles, crop, LSL, activation du bouton et absence de modèles dans les fichiers du projet et l’historique.

## Confidentialité

Ne pas ajouter de modèle commercial au dépôt. Les fichiers `.glb`, `.gltf`, `.fbx`, `.blend`, `.dae`, `.obj` et autres formats 3D sont ignorés par Git. Tout fichier publié sur un site public est récupérable par un visiteur. Aucun modèle 3D n’est nécessaire au fonctionnement de FrameLab.
