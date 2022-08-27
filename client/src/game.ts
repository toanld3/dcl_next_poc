import { getConnectedPlayers, getPlayerData } from "@decentraland/Players"
import { getUserData } from "@decentraland/Identity"
import { NPC, Dialog } from '@dcl/npc-scene-utils'
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
            { label: `Call da manager`,
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
    scale: new Vector3(0.061250001192092896, 0.061250001192092896, 0.061250001192092896)
})

let myNPC = new NPC(npcTransform, 'models/NPC/scene.gltf', () => {
    myNPC.talk(mrCrowDialog, 'greeting')
}, {
    portrait: { path: 'models/NPC/ava.png', height: 173, width: 180 },
    hoverText: 'Mr Crow',
    idleAnim: `Take 001`,
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