// Toy data — edit this file to add/remove/update toys
// Add a `link` field to show a "Buy on Amazon" button on the card.
// Add `type: "book"` for books (anything without it is treated as a toy).
const TOYS = {
  "0-3": [
    {
      emoji: "🏋️",
      name: "Play Gym",
      desc: "A must-have from day one. Dangling toys and a padded mat make tummy time enjoyable and stimulating.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/44528ey"
    },
    {
      emoji: "🌈",
      name: "Play Mat",
      desc: "Soft, cushioned mat perfect for rolling, reaching, and early floor play.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/452NK6M"
    },
    {
      emoji: "🖤🤍",
      name: "Black & White Flash Cards",
      desc: "High-contrast patterns are exactly what newborn eyes can process. Great for tummy time focus.",
      stars: 5,
      tags: ["hit", "budget"],
      link: "https://amzn.to/3V0bfKk"
    },
    {
      emoji: "📖",
      name: "Cloth Books",
      type: "book",
      desc: "Soft, chewable, crinkly books that babies can hold and explore safely.",
      stars: 4,
      tags: ["hit", "budget"],
      link: "https://amzn.to/3pytWsL"
    },
    {
      emoji: "👀",
      name: "Look Look Book",
      type: "book",
      desc: "Bold, high-contrast illustrations designed specifically for newborn vision development.",
      stars: 5,
      tags: ["hit", "budget"],
      link: "https://amzn.to/3VwbDSm"
    }
  ],
  "3-6": [
    {
      emoji: "🎵",
      name: "Rattles for Babies",
      desc: "Easy-grip rattles that make satisfying sounds — perfect for little fists discovering cause and effect.",
      stars: 5,
      tags: ["hit", "budget"],
      link: "https://amzn.to/3DXBbOQ"
    },
    {
      emoji: "🪄",
      name: "Cloth Rattle",
      desc: "Soft fabric rattle safe for gumming and shaking. Lightweight enough for tiny hands.",
      stars: 4,
      tags: ["budget"],
      link: "https://amzn.to/44124ww"
    },
    {
      emoji: "🦷",
      name: "Rattle + Teether",
      desc: "Two-in-one: shakes for auditory fun and soothes sore gums. A staple in our bag.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/3r3849x"
    },
    {
      emoji: "🐟",
      name: "Fish Rattle",
      desc: "Cute fish-shaped rattle that's easy to hold and visually engaging.",
      stars: 4,
      tags: [],
      link: "https://amzn.to/46X92og"
    },
    {
      emoji: "⚽",
      name: "Ball Rattle Set",
      desc: "Set of textured balls in different sizes — great for grip strength and sensory exploration.",
      stars: 4,
      tags: ["budget"],
      link: "https://amzn.to/449JrWi"
    },
    {
      emoji: "🟠",
      name: "Soft Ball",
      desc: "Squishy, lightweight ball that's safe for rolling, throwing, and chewing.",
      stars: 4,
      tags: ["budget"],
      link: "https://amzn.to/3NrYYuf"
    },
    {
      emoji: "💧",
      name: "Water Mat",
      desc: "Sensory water-filled mat — babies love pressing it and watching the sea creatures move inside.",
      stars: 5,
      tags: ["hit", "budget"],
      link: "https://amzn.to/3VgG9iV"
    },
    {
      emoji: "🛁",
      name: "Bath Toys",
      desc: "Squirty, stackable bath toys that make water time fun from an early age.",
      stars: 4,
      tags: ["budget"],
      link: "https://amzn.to/4e2H3qF"
    }
  ],
  "6-9": [
    {
      emoji: "📦",
      name: "Curious Cubs (6m+)",
      desc: "Subscription box tailored for 6-month-old development. Great variety of sensory toys.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/43VpvJ1"
    },
    {
      emoji: "🪆",
      name: "Rolly Polly Toy",
      desc: "Classic wobbly toy that rights itself — babies are fascinated by the rocking motion.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/44gE0Wr"
    },
    {
      emoji: "🟠",
      name: "Soft Ball",
      desc: "Squishy, lightweight ball that's safe for rolling, throwing, and chewing.",
      stars: 4,
      tags: ["budget"],
      link: "https://amzn.to/3NrYYuf"
    },
    {
      emoji: "💧",
      name: "Water Mat",
      desc: "Sensory water-filled mat — babies love pressing it and watching the sea creatures move inside.",
      stars: 5,
      tags: ["hit", "budget"],
      link: "https://amzn.to/3VgG9iV"
    },
    {
      emoji: "🛁",
      name: "Bath Toys",
      desc: "Squirty, stackable bath toys that make water time fun from an early age.",
      stars: 4,
      tags: ["budget"],
      link: "https://amzn.to/4e2H3qF"
    }
  ],
  "9-12": [
    {
      emoji: "📦",
      name: "Object Permanence Box",
      desc: "Drop the ball in, watch it reappear — teaches object permanence, a huge cognitive milestone.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/40zvqTc"
    },
    {
      emoji: "📦",
      name: "Curious Cubs (9–12 months)",
      desc: "Age-appropriate subscription box for older babies — great for discovery and fine motor skills.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/46WfNX3"
    },
    {
      emoji: "🧱",
      name: "Curious Cubs Stacking Blocks",
      desc: "Chunky soft blocks perfect for stacking, knocking down, and learning colours.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/3PtzS07"
    },
    {
      emoji: "🌀",
      name: "Roll Swirling Toy",
      desc: "Push it and watch the beads swirl — satisfying cause-and-effect play for curious babies.",
      stars: 4,
      tags: [],
      link: "https://amzn.to/3PurVZm"
    },
    {
      emoji: "🧸",
      name: "Little's Set",
      desc: "All-in-one activity set with multiple textures and features to keep babies engaged.",
      stars: 4,
      tags: ["budget"],
      link: "https://amzn.to/3JBJrH8"
    },
    {
      emoji: "🎵",
      name: "Xylophone",
      desc: "Classic wooden xylophone — babies love bashing it and hearing the different notes.",
      stars: 5,
      tags: ["hit", "budget"],
      link: "https://amzn.to/46r4pT9"
    },
    {
      emoji: "📿",
      name: "Little's Colorful Beads",
      desc: "Bright bead roller coaster that builds fine motor skills and colour recognition.",
      stars: 4,
      tags: [],
      link: "https://amzn.to/3DmrHfn"
    },
    {
      emoji: "🌵",
      name: "Cactus Toy",
      desc: "Stacking rings with a fun cactus shape — a fresh twist on a classic that babies adore.",
      stars: 5,
      tags: ["hit"],
      link: "https://amzn.to/3Nt86PC"
    }
  ],
  "1-2": [
    {
      emoji: "🚂",
      name: "BRIO My First Railway",
      desc: "Chunky wooden train pieces, easy for 1-year-old hands. Grows with the child as they add tracks.",
      stars: 5,
      tags: ["hit"]
    },
    {
      emoji: "🎨",
      name: "Crayola My First Finger Paints",
      desc: "Washable and non-toxic. Messy but endlessly fun. Get a splat mat underneath!",
      stars: 4,
      tags: ["hit", "budget"]
    },
    {
      emoji: "🧩",
      name: "Melissa & Doug Peg Puzzles",
      desc: "Chunky pegs are easy to grasp. Farm, vehicles, and shape sets are all winners.",
      stars: 5,
      tags: ["hit"]
    },
    {
      emoji: "📚",
      name: "That's Not My... Book Series",
      type: "book",
      desc: "Touchy-feely textures on every page. Our toddler requested these at every bedtime.",
      stars: 5,
      tags: ["hit", "budget"]
    }
  ],
  "2-3": [
    {
      emoji: "🏗️",
      name: "LEGO DUPLO Classic Brick Box",
      desc: "The gold standard. Endlessly reusable, compatible with any DUPLO set, and virtually indestructible.",
      stars: 5,
      tags: ["hit"]
    },
    {
      emoji: "🎭",
      name: "Melissa & Doug Dress-Up Trunk",
      desc: "Firefighter, princess, doctor costumes — sparked hours of imaginative play.",
      stars: 5,
      tags: ["hit"]
    },
    {
      emoji: "🖍️",
      name: "Melissa & Doug Easel",
      desc: "Double-sided chalkboard/whiteboard. One of the best investments for creative toddlers.",
      stars: 5,
      tags: ["hit"]
    },
    {
      emoji: "🎯",
      name: "Kinetic Sand",
      desc: "Sensory play that stays together (mostly). Tidy-up is real work but kids go crazy for it.",
      stars: 3,
      tags: ["skip"]
    }
  ],
  "3-4": [
    {
      emoji: "🔭",
      name: "Osmo Genius Starter Kit",
      desc: "Tablet-based tangible learning. Blends physical pieces with a screen in a genuinely clever way.",
      stars: 4,
      tags: ["hit"]
    },
    {
      emoji: "🧲",
      name: "Magna-Tiles 32-Piece Set",
      desc: "Magnetic tiles that click together — builds spatial reasoning and creativity. Worth the price.",
      stars: 5,
      tags: ["hit"]
    },
    {
      emoji: "🎲",
      name: "Zingo! (ThinkFun)",
      desc: "Fast-paced bingo-style game. Great first board game — teaches turn-taking and matching.",
      stars: 5,
      tags: ["hit", "budget"]
    },
    {
      emoji: "🦖",
      name: "Schleich Dinosaur Figures",
      desc: "Hand-painted, ultra-detailed figures. Sparks rich imaginative play and great for collections.",
      stars: 5,
      tags: ["hit"]
    }
  ]
};
