Look at the various prototypes in this portfolio. They all share a design system in common. We are going to make a new page, and first, I want you to research the current design system, and come up with information that we'll use in a plan step to make sure our new portfolio item get's the shared design system correctly, while supplying minimal context in terms of files and lines of files to reference.

--

Create references for how we will deploy a new subdomain to the existing domain, cookinupideas.com, using terraform. This will be for "learningpath.cookinupideas.com".

--

Analyze the current projects testing approach, and create references for how to incorporate the same style of testing for the new site.

--

Generate synthetic data-objects matching the following schema:

{
    "recipe": {
        "name": "xxx",
        "description": "yyy",
        "origin": "Sicily, Italy",
        "ingredients": [
            {
                "id": 1,
                "name": "aaa",
                "cost_dollars": 4,
                "known_sources": ["Trader Joes", "HMart"],
                "description": "bbb",
                "amount": 6,
                "units_of_measurement": "grams"
            }
        ],
        "steps": [
            {
                "id": 5,
                "stage": 1,
                "tools_required": ["oven", "casserole_dish"],
                "time_required_min": 10,
                "depends_on_steps": [1,4],
                "ingredients_required": [
                    {
                        "id": 1,
                        "amount": 2
                    }, {...}
                ]
                "description": "zzz"

            }, {...}
        ]

    }
}

Generate items for 5 categories of food:
* Middle Eastern
* Japanese
* Peruvian
* Italian
* Irish

--

Compile the results from the previous analyses, and proceed to implement a new portfolio item site to the following specification.

# Section 1 - recipe cluster viewer
## Section 1 header:
* A set of 5 buttons that are horizontal spans. They span a viewport below them which will display a clustered node visual.
* Each button corresponds to a cluster. There are 5 clusters total.

## Section 1 body:
* Three clusters can be shown at any time
* The clusters are along a straight horizontal line
* If the middle 3 of the 5 clusters are in the viewport, then the middle three buttons will be shaded purple. The other two, one on either end, will be un-shaded in the buttons, and out of view of the viewport.
* The line that the three clusters are on will have arrows if there is a hidden cluster in that direction. When the middle of the 5 buttons is selected, the line will have arrows on both sides. If any other button is selected, there will only be an arrow on one side of the line.

## Section 1 implementation:
* Now, use the SigmaJS and graphology libraries to update the viewport in Section1 to show clusters of points around the horizontal line.
* Each of the Cuisine clusters should have a different layout of poitns, and have their own color that should stay consistent as the viewport changes. If one of the Cuisines on the "end", i.e. Middle Eastern on the left, or Irish on the right, is selected, then only 2 cusines should be shown in the dviewport.
* The layouts should be random inside of a circle, I want to give it a "radial" feel.
* Make the background of the viewport a light grey color, and make the circles slightly bigger. Remove the list view from Section 1
* Make the saturation of the color of the recipe's node grow as it has been made more times.
* The nodes were black because Sigma/WebGL wasn’t using CSS hsl() strings. I switched to hex colors by converting HSL to HEX and kept cuisine-stable hue/lightness with saturation driven by progress.
* Do not allow for panning or zoom in the viewport
* Update the steps for each of the recipes to be realistic for cooking each dish
* Use the country_borders.geo.json to render a silhouette of the country behind the cluster of points that stand for its recipes

# Section 2 - Recipes written out
## Section 2 header: Foods of the world

## Section 2 body panels:
* One body panel for each regional cuisine
* Each body panel has the name of the cuisine in gold, next to a map of that country in a stylized greyscale
* The text in the body panel shows all of the recipe names that match what is shown in the clusters above
* Each line can have 1, 2, or 3 "broccoli" symbols next to them, which start off as little green outlines with white inside.
* If the active user has made that dish 1 time, the first broccoli turns green inside. If they make it a second or third time, the second and third broccolis are filled in. 
* When all 3 broccolis are filled in next to a dish, that line of the visual turns highlighted gold.
* The background looks like parchment.

# Section 3 - Recipes on the world map
## Section 3 header: Recipes Around the World

## Section 3 body:
* A map of the world in grey-scale
* Recipes get placed in a hex-grid inside of their home country's borders

# General interaction guidelines
* When a recipe circle is hovered over, it shows the name of the recipe, and the origin location
* When a recipe circle is clicked on, it causes a item view to pop up and display the recipe information. In the top right, there are two buttons: one for "I made it!", and one for "close window".
* When a recipe circle is selected in Section 1, it should update the selected recipe in sections 2 and 3.
* This should be true whether you select a circle in Section 1, 2, or 3.


--

Run the app locally so that I can test it, and give me directions on how to deploy to production.