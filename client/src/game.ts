import { getConnectedPlayers, getPlayerData } from "@decentraland/Players"
import { getUserData } from "@decentraland/Identity"
import {NPC, Dialog, DialogWindow,  ImageData} from '@dcl/npc-scene-utils'
import * as ui from '@dcl/ui-scene-utils'
const managerWallets = ['0x2d961678e01e88ed7e240c79a21fbf4fd437c4db', '0x67e36df3eff7614cfa77a1afb0f085f7a8743718']
let scenePlayers = {};
let inQuest = false;
// Base
//<editor-fold desc="Base">
const _scene = new Entity('_scene')
engine.addEntity(_scene)
const transform = new Transform({
    position: new Vector3(0, 0, 0),
    rotation: new Quaternion(0, 0, 0, 1),
    scale: new Vector3(1, 1, 1)
})
_scene.addComponentOrReplace(transform)

const entity = new Entity('entity')
engine.addEntity(entity)
entity.setParent(_scene)
const gltfShape = new GLTFShape("models/FloorBaseGrass_01/FloorBaseGrass_01.glb")
gltfShape.withCollisions = true
gltfShape.isPointerBlocker = true
gltfShape.visible = true
entity.addComponentOrReplace(gltfShape)
const transform2 = new Transform({
    position: new Vector3(8, 0, 8),
    rotation: new Quaternion(0, 0, 0, 1),
    scale: new Vector3(1, 1, 1)
})
entity.addComponentOrReplace(transform2)
// Create AudioClip object, holding audio file
const clip = new AudioClip("sounds/background.mp3")

// Create AudioSource component, referencing `clip`
const source = new AudioSource(clip)
_scene.addComponent(source);
source.playing = true
source.loop = true
source.volume = 1.5

const entity2 = new Entity('entity2')
engine.addEntity(entity2)
entity2.setParent(_scene)
entity2.addComponentOrReplace(gltfShape)
const transform3 = new Transform({
    position: new Vector3(24, 0, 8),
    rotation: new Quaternion(0, 0, 0, 1),
    scale: new Vector3(1, 1, 1)
})
entity2.addComponentOrReplace(transform3)

const entity3 = new Entity('entity3')
engine.addEntity(entity3)
entity3.setParent(_scene)
entity3.addComponentOrReplace(gltfShape)
const transform4 = new Transform({
    position: new Vector3(8, 0, 24),
    rotation: new Quaternion(0, 0, 0, 1),
    scale: new Vector3(1, 1, 1)
})
entity3.addComponentOrReplace(transform4)

const entity4 = new Entity('entity4')
engine.addEntity(entity4)
entity4.setParent(_scene)
entity4.addComponentOrReplace(gltfShape)
const transform5 = new Transform({
    position: new Vector3(24, 0, 24),
    rotation: new Quaternion(0, 0, 0, 1),
    scale: new Vector3(1, 1, 1)
})
entity4.addComponentOrReplace(transform5)
//</editor-fold>
let currentUserData, callUrl = '', contextCount = Math.random().toString();
const bearer = "ya29.a0AVA9y1s07SwwoD1gZZdNlB2IBGrizPKxLJxQ6100uid_iWUlgzrfaK6SrBuKHUmntD58eFYM-8wA1x_UrGZgsfwtWYrjRS57MVGv9JYlQUfN1aniyCxWIVJHg1VoN1-hsyqoNcGfxl7dYVh6X1t3f4wA4yG8EwaCgYKATASAQASFQE65dr836dBw4ToYrcoby7kPkUYYw0165";
executeTask(async () => {
    try {
        currentUserData = await getUserData()
        callUrl = `https://dialogflow.googleapis.com/v2/projects/testvietnameseagent-ikbl/agent/sessions/`
    } catch {
        log("failed to reach URL")
    }
})


async function callQuery(text: string) {
    const data = {
        "query_input": {
            "text": {
                "text": text,
                "language_code": "vi"
            }
        }
    }
    // ${currentUserData?.userId}
    let response = await fetch(`${callUrl}${contextCount}:detectIntent`, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${bearer}` },
        method: "POST",
        body: JSON.stringify(data),
    })
    return await response.json()
}
const chatbotImage = {path: 'models/NPCGirl/ava.png', height: 164, width: 169 }
let dialogWindow = new DialogWindow(chatbotImage)

function cleanSession() {
    contextCount = Math.random().toString();
    dialogWindow.closeDialogWindow()
    dialogWindow = new DialogWindow(chatbotImage)
}

async function buildNextDialog(json: any) {
    dialogWindow.closeDialogWindow()
    const dialogTitle = json.queryResult.fulfillmentText;
    // @ts-ignore
    const filterResponses = json.queryResult.fulfillmentMessages.filter(item => !item.hasOwnProperty('platform')).filter(item => item.hasOwnProperty('payload'));
    log(filterResponses)
    const payloads = filterResponses.reduce((acc: any, current: { payload: { richContent: any } }) => {
        log(current)
        const richContent = current.payload.richContent;
        const flattenRichContent = richContent.flat();
        let options = flattenRichContent.reduce((acc2: any, current2: { options: any[] }) => {
            return [...acc2, ...(current2.options.map(option => option.text))]
        }, [])
        return [...acc, ...options];
        // return [...acc, ...(current.payload.richContent)]
    }, [])
    log(payloads)
    const name = Math.random().toString()
    const currentSession = contextCount;
    const buttons = payloads.map((payload: string) => {
        return { label: payload,
            goToDialog: name,
            triggeredActions: async () => {
                if (currentSession === contextCount) {
                    log('trigger inside btn')
                    const json = await callQuery(payload)
                    await buildNextDialog(json)
                }
            }
        }
    })
    const dialog = [{
        name: name,
        text: dialogTitle,
        ...(payloads.length > 0 && { isQuestion: payloads.length > 0}),
        isEndOfDialog: true,
        ...(payloads.length > 0 && { buttons: buttons})
    }];
    log(dialog)

    dialogWindow = new DialogWindow(chatbotImage)
    dialogWindow.openDialogWindow(dialog, name)
    // if (payloads.length === 0) {
    //     await cleanSession()
    // }
    // myNPC.endInteraction();
    // myNPC.talk(dialog, name)
}


//<editor-fold desc="NPC">
let mrCrowDialog: Dialog[] = [
    {
        name: 'greeting',
        text: `Greeting traveller!`,
        triggeredByNext: async () => {
            log(scenePlayers)
            const currentUserData = await getUserData()
            if (currentUserData?.userId && managerWallets.indexOf(currentUserData?.userId) !== -1) {
                myNPC.talk(mrCrowDialog, 'good_day_manager')
            } else {
                myNPC.talk(mrCrowDialog, 'wanna_help')
            }
        },
        isEndOfDialog: true,
    },
    {
        name: 'wanna_help',
        text: `Wanna ask somethings?`,
        isQuestion: true,
        isEndOfDialog: true,
        buttons: [
            { label: `Try chatbot`,
                goToDialog: 'chat_bot_start',
                triggeredActions: () => {
                    log('trigger outside btn')
                    cleanSession()
                }
            },
            { label: `Call manager`,
                goToDialog: 'manager_will_come',
                triggeredActions: async () => {
                    log('Hi')
                    const currentUserData = await getUserData()
                    let managerId = undefined;
                    for (const player of Object.keys(scenePlayers)) {
                        // @ts-ignore
                        if (scenePlayers[player].isManager && !scenePlayers[player].isInQuest) {
                            managerId = player;
                            break;
                        }
                    }
                    // scenePlayers.find(item => item.isManager && !item.isInQuest)
                    // const managerId = Object.keys(scenePlayers)
                    if (managerId) {
                        sceneMessageBus.emit("create_quest", { uId: currentUserData?.userId, managerId: managerId })
                        myNPC.talk(mrCrowDialog, 'manager_will_come')
                    } else {
                        myNPC.talk(mrCrowDialog, 'no_manager_available')
                    }
                }
            },
            { label: `I'm busy`,
                goToDialog: 1,
                triggeredActions: () => {
                    myNPC.endInteraction()
                }
            }
        ],
    },
    {
        name: 'good_day_manager',
        text: `Good day, manager!`,
        isEndOfDialog: true
    },
    {
        name: 'chat_bot_start',
        text: `Chatbot will take it from here`,
        triggeredByNext: async () => {
            cleanSession()
            const json = await callQuery('phục vụ')
            await buildNextDialog(json)
        },
        isEndOfDialog: true
    },
    {
        name: 'manager_will_come',
        text: `Pls wait a few min, manager will come to you!`,
        isEndOfDialog: true
    },
    {
        name: 'no_manager_available',
        text: `There is no manager available, pls wait!`,
        isEndOfDialog: true
    },
]
const npcTransform = new Transform({
    position: new Vector3(8.5, 0, 12),
    rotation: new Quaternion(0, 0, 0, 1),
    scale: new Vector3(1.9, 1.9, 1.9)
})

let myNPC = new NPC(npcTransform, 'models/NPCGirl/etrian_odyssey_3_monk.glb', () => {
    myNPC.talk(mrCrowDialog, 'greeting')
}, {
    portrait: { path: 'models/NPCGirl/ava.png', height: 170, width: 170 },
    hoverText: 'Ms Amy',
    idleAnim: `Scene`,
    coolDownDuration: 1,
    reactDistance: 1,
    faceUser: true,
    onlyClickTrigger: true,
    continueOnWalkAway: false,
    onWalkAway: () => {
        myNPC.endInteraction()
    }
})
//</editor-fold>

// create canvas
//<editor-fold desc="Create Canvas">
const canvas = new UICanvas()
let allRects: UIContainerStack[] = [];
function questCleanUp () {
    for (const item of allRects) {
        item.visible = false;
    }
}
async function createQuestUi(uId: string) {
    // create container inside canvas
    let data = await getPlayerData({ userId: uId })
    const rect = new UIContainerStack(canvas)
    rect.adaptHeight = true
    rect.adaptWidth = true
    rect.hAlign = 'left'
    rect.vAlign = 'top'

    const questInfo = new UIText(rect)
    questInfo.outlineColor = new Color4(1, 1, 1, 1)
    questInfo.value = 'Quest info:'
    questInfo.fontSize = 12
    questInfo.width = 180
    questInfo.height = 130
    questInfo.positionX = 15
    questInfo.positionY = 0
    questInfo.color = new Color4(1, 1, 1, 1)
    questInfo.textWrapping = true
    questInfo.outlineWidth = 0.2

    const txt = new UIText(rect)
    txt.outlineColor = new Color4(1, 1, 1, 1)
    txt.value = `- Find user ${data?.displayName || data?.userId}`
    txt.fontSize = 10
    txt.width = 180
    txt.height = 14
    txt.positionX = 15
    txt.positionY = 0
    txt.color = new Color4(1, 1, 1, 1)
    txt.textWrapping = true
    log(data?.avatar?.snapshots?.face256)
    const currentUserData = await getUserData()
    // let avaTexture = new Texture(<string>data?.avatar?.snapshots?.face256)
    // let avaTexture = new Texture("https://decentraland.org/blog/images/static/images/full-layout2-309375d3ccedb39736f5114d0d2facc7.jpg")

    // const ava = new UIImage(rect, avaTexture)
    const ava = new UIImage(rect, new AvatarTexture(uId.toLowerCase()))
    ava.hAlign = 'left'
    ava.vAlign = 'top'
    ava.sourceLeft = 0
    ava.sourceTop = 0
    ava.sourceWidth = 256
    ava.sourceHeight = 256
    ava.width = 65
    ava.height = 55
    ava.paddingLeft = 15
    ava.paddingTop = 5
    ava.onClick  = new OnClick(() => {
        questCleanUp()
        inQuest = false;
        sceneMessageBus.emit("res_in_quest", { uId: currentUserData?.userId, isInQuest: false })
    })
    inQuest = true;
    sceneMessageBus.emit("res_in_quest", { uId: currentUserData?.userId, isInQuest: true })
    allRects.push(rect)
}
//</editor-fold>

const sceneMessageBus = new MessageBus()

sceneMessageBus.on("create_quest", async (info: any) => {
    const currentUserData = await getUserData()
    if (currentUserData?.userId && managerWallets.indexOf(currentUserData?.userId) !== -1 && currentUserData?.userId === info?.managerId) {
        await createQuestUi(info?.uId)
    }
})

sceneMessageBus.on("ask_is_in_quest", async (info: any) => {
    const currentUserData = await getUserData()
    if (currentUserData?.userId && managerWallets.indexOf(currentUserData?.userId) !== -1 && currentUserData === info?.uId) {
        sceneMessageBus.emit("res_in_quest", { uId: currentUserData?.userId, isInQuest: inQuest })
    }
})

sceneMessageBus.on("res_in_quest", async (info: any) => {
    if (info.uId && scenePlayers.hasOwnProperty(info?.uId)) {
        // @ts-ignore
        scenePlayers[info.uId].isInQuest = info?.isInQuest;
    }
})

// Event when player connects
onPlayerConnectedObservable.add(async (player) => {
    // @ts-ignore
    scenePlayers[player.userId] = {
        uId: player.userId,
        isManager: managerWallets.indexOf(player.userId.toLowerCase()) !== -1,
        isInQuest: false
    }
    if (managerWallets.indexOf(player.userId.toLowerCase()) !== -1) {
        sceneMessageBus.emit("ask_is_in_quest", { uId: player.userId })
    }
    log("player entered: ", player.userId)
})

// Event when player disconnects
onPlayerDisconnectedObservable.add((player) => {
    // @ts-ignore
    delete scenePlayers[player.userId];
    log("player left: ", player.userId)
})
