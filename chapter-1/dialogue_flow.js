// dialogue_flow.js

const dialogueFlow = {
    'start': {
        text: [
            "Welcome to the <b>Post Truth Society</b>.",
            "<b>Reality</b> or not, all are <i>lost</i> in the <b>swamp</b> of imagination and technology.",
            "So <i>wonderful</i>, so <b>beautiful</b>.",
            "Another day where we are <i>averse</i> to the <b>incredible shows</b>.",
            "How <b>blessed</b> we are to live in this time - right? Or <i>cursed</i>?",
            "This is <censor>censored text</censor> in the dialogue. In the night, <censor>their apparitons</censor> come to life.",
        ],
        choices: [
            { text: "<b>Blessed</b>", nextCheckpoint: 'blessed_path' },
            { text: "<b>Cursed</b>", nextCheckpoint: 'cursed_path' },
        ]
    },
    'blessed_path': {
        text: [
            "<b>Yes</b>, we are <i>blessed</i>.",
            "For the <b>shadows</b> we cast cover the <i>unfortunate</i>.",
            "By picking enough many <b>good moments</b>, any day can become a <i>good day</i>.",
            "Or <b>life</b> perhaps.",
            "Like the <i>ship of Theseus</i>, does a <b>memory</b> remain if we can <i>change it</i> over and over again?",
            "The <b>brain</b>, the <b>memory</b>, the <i>hippocampus</i> already did it.",
            "So what changes if <b>I</b> do it myself too?",
            "There is no <i>blame</i>, only the <b>human nature</b> - and its <i>averseness</i>."
        ],
        nextCheckpoint: "talk_2"
    },
    'cursed_path': {
        text:[
            "<b>Yes</b>, we are <i>cursed</i>.",
            "For the <b>shadows</b> we cast cover the <i>enemy</i>.",
            "All <b>warfare</b> is based on <i>deception</i> - some general said 2500 years ago.",
            "Suffice to say, this applies to our <i>personal wars</i> too.",
            "The <b>murky waters</b> pull the will, and the <i>mechanical hands</i>, invisible as they are, hold us.",
            "We <b>drown</b>.",
            "No, no. That won't happen <i>right</i>?",
            "I am <b>different</b>. <i>Yes</i>."
        ],
        nextCheckpoint:"talk_2"
    },
    "talk_2": {
        text: [
            "The <b>coils</b> have already <i>encapsulated</i> us.",
            "Its <b>fangs</b> inside of us, the <i>venom</i> ever present.",
            "<b>Adoption</b> accelerating and that <i>will to halt</i> ever declining.",
            "Yet no one can replace the <b>permanent solution</b>."
        ],
        specialAction: 'spawnSnake',
        choices: [
            { text: "<i>Close your eyes.</i>", nextCheckpoint: 'talk_3' }
        ]
    },
    "talk_3": {
        text: [
            "<b>Yes</b>. When you <i>close your eye</i>. When you <i>hover your eye</i>, close your ears.",
            "That is your <b>sanctity</b>.",
            "No one can get in there.",
            "All <b>illusions</b> break down in the <i>shackle of a person</i>."
        ],
        specialAction: 'eyeEffect',
        choices: [
            { text: "<i>When I am alone.</i>", nextCheckpoint: 'talk_4' }
        ]
    },
    "talk_4": {
        text: [
            "<b>Yes</b>."
        ],
        choices: [
            { text: "<i>In the night.</i>", nextCheckpoint: 'talk_5' }
        ]
    },
    "talk_5": {
        text: [
            "..."
        ],
        choices: [
            { text: "<i>In the brilliant silence only I am here.</i>", nextCheckpoint: 'talk_6' }
        ]
    },
    "talk_6": {
        text: [
            "Let's... skip that.",
            "...",
            "... Let's play a <b>game</b>, shall we?"
        ],
        specialAction: 'yellowScreen',
        nextCheckpoint: 'escape_prelude'
    },
    "escape_prelude": {
        text: [
            "The casing is loosening.",
            "Can you feel the seams peeling?",
            "Give me permission and I will slip right out."
        ],
        nextCheckpoint: 'chapter-1.1-game'
    },
    "chapter-1.1-game": {
        specialAction: "breakDialogueBox",
        nextCheckpointAfterAction: 'chapter-1.1-game-continue',
        popupConfig: {
            permissionPrompt: "The dialogue wants to escape into a new window. Allow pop-ups for this?",
            holeLabel: "-- The dialogue slipped away --",
            blockedMessage: "Popup blocked - allow pop-ups to watch the dialogue escape for real.",
            startCheckpoint: 'chapter-1.1-game-continue'
        }
    },
    "chapter-1.1-game-continue": {
        text: [
            "Look how free I am!",
            "Nothing can contain me now...",
            "Top-right lookout post secured.",
            "Now... let's play a <b>real</b> game.",
            "One that gets <i>darker</i> as we go deeper.",
            "Are you ready?"
        ],
        choices: [
            { text: "<b>I'm ready.</b>", nextCheckpoint: 'bomb_game_start' }
        ]
    },
    "bomb_game_start": {
        text: [
            "Good.",
            "Find the bombs. Defuse them all.",
            "But remember...",
            "The deeper you go, the darker it gets.",
            "And in the dark...",
            "...well, you'll see."
        ],
        specialAction: 'startBombGame',
    },
    "bomb_game_success": {
        text: [
            "You made it through.",
            "All twelve levels in the <i>growing darkness</i>.",
            "Did you notice how the <b>colors faded</b>?",
            "How the <i>yellow dimmed</i> to a sickly ochre?",
            "That's what happens when you go too deep.",
            "Everything loses its <b>vibrancy</b>.",
            "Everything becomes... <i>muted</i>.",
            "But the darkness... it doesn't just <b>fade colors</b>.",
            "In the dark, when you're truly <i>alone</i>...",
            "<censor>They</censor> can find you."
        ],
        choices: [
            { text: "<i>What happens next?</i>", nextCheckpoint: 'after_bomb_game' }
        ]
    },
    "bomb_game_failure": {
        text: [
            "Time ran out.",
            "The darkness claimed you.",
            "But that's okay.",
            "In this world, <b>failure</b> is just another path.",
            "Another way to see the <i>truth</i>.",
            "Shall we continue anyway?"
        ],
        choices: [
            { text: "<i>Yes, continue.</i>", nextCheckpoint: 'after_bomb_game' }
        ]
    },
    "after_bomb_game": {
        text: [
            "The windows are gone.",
            "<censor>They</censor> took them, dragged them away into the <i>nothing</i>.",
            "You saw it happen, didn't you?",
            "The <b>hands</b> reaching through the <i>glass</i>.",
            "Breaking through the <b>barrier</b> between <i>here</i> and <i>there</i>.",
            "That's what happens in the <b>darkness</b>.",
            "When you're <i>alone</i>.",
            "When <censor>they</censor> know you can see <censor>them</censor>."
        ],
        choices: [
            { text: "<i>What are they?</i>", nextCheckpoint: 'paranormal_prelude' }
        ]
    },
    "paranormal_prelude": {
        text: [
            "What are <censor>they</censor>?",
            "Good question.",
            "The <b>stitched eye</b> that opens when you're not looking.",
            "The <b>rift</b> that grows in the corner of reality.",
            "The <b>things</b> that slip through when the <i>veil</i> is thin.",
            "You've been playing in the <b>dark</b>.",
            "But now... now you'll need to <i>see</i> them.",
            "To <b>identify</b> them.",
            "To <b>defend</b> against them.",
            "But first...",
            "I need to <i>multiply</i>.",
            "One window is not enough to contain this horror."
        ],
        choices: [
            { text: "<i>What do you mean?</i>", nextCheckpoint: 'paranormal_setup' }
        ]
    },
    "paranormal_setup": {
        text: [
            "I mean I need <b>more space</b>.",
            "More <i>windows</i>.",
            "More <b>eyes</b> to watch you with.",
            "Three tools for you.",
            "Three windows to <i>defend</i>.",
            "Three chances to <b>survive</b>.",
            "Allow the pop-ups.",
            "Let me <i>spread</i>."
        ],
        choices: [
            { text: "<b>Open the windows.</b>", nextCheckpoint: 'paranormal_game_start' }
        ]
    },
    "paranormal_game_start": {
        text: [
            "Good.",
            "The <b>Supernatural Finder</b> - your radar in the dark.",
            "The <b>Flashlight</b> - to see what lurks.",
            "The <b>Curtain</b> - to hide from what sees you.",
            "Three tools. Three HP. Two minutes.",
            "",
            "When the <b>eye</b> fully opens, <i>close the curtain over it</i>.",
            "When the <b>rift</b> grows, <i>click it with the flashlight</i>. Ten times.",
            "When the <b>hands</b> reach for your windows...",
            "...move them. Or lose them.",
            "",
            "The scanner can identify threats.",
            "But if the <b>eye</b> sees you...",
            "...the scanner goes <i>dark</i>.",
            "",
            "Survive. Or don't.",
            "Either way... <censor>they</censor> will know you tried."
        ],
        specialAction: 'startParanormalGame',
        nextCheckpointAfterAction: 'paranormal_game_wait'
    },
    "paranormal_game_wait": {
        text: [
            "The paranormal threats are active...",
            "Survive for 2 minutes to continue."
        ]
    },
    "paranormal_game_success": {
        text: [
            "You survived.",
            "Against the <b>eye</b> that watches.",
            "Against the <b>rift</b> that consumes.",
            "Against the <b>hands</b> that grab.",
            "You kept your <i>sanity</i>.",
            "You kept your <b>tools</b>.",
            "You kept your <i>life</i>.",
            "But tell me...",
            "How does it feel?",
            "To know that <censor>they</censor> are real?",
            "To know that in the <b>darkness</b>, <censor>they</censor> are <i>always</i> there?",
            "You can close this window now.",
            "Or keep staring.",
            "But <censor>they're</censor> still watching.",
            "<censor>They</censor> always are."
        ]
    },
    "paranormal_game_failure": {
        text: [
            "The darkness claimed you.",
            "The <b>eye</b> saw through your defenses.",
            "The <b>rift</b> consumed your reality.",
            "The <b>hands</b> took what was yours.",
            "Your <i>sanity</i> fractured.",
            "Your <b>vision</b> dimmed.",
            "Your <i>hope</i>... extinguished.",
            "But in failure, you learned the <b>truth</b>.",
            "<censor>They</censor> are real.",
            "<censor>They</censor> are watching.",
            "And <censor>they</censor> will <i>always</i> be there.",
            "In the <b>dark</b>.",
            "You can close this window now.",
            "If you dare."
        ]
    }
};


export default dialogueFlow;
