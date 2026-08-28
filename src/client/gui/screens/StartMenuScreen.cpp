#include "StartMenuScreen.h"
#include "UsernameScreen.h"
#include "SelectWorldScreen.h"
#include "ProgressScreen.h"
#include "../../player/LocalPlayer.h"
#include "../../renderer/entity/EntityRenderDispatcher.h"

#include "JoinGameScreen.h"
#include "OptionsScreen.h"
#include "PauseScreen.h"
#include "PrerenderTilesScreen.h" // test button
#include "../components/ImageButton.h"

#include "../../../util/Mth.h"

#include "../Font.h"
#include "../components/ScrolledSelectionList.h"

#include "../../Minecraft.h"
#include "../../renderer/Tesselator.h"
#include "../../../AppPlatform.h"
#include "../../../LicenseCodes.h"
#include "SimpleChooseLevelScreen.h"
#include "../../renderer/Textures.h"
#include "../../../SharedConstants.h"

// Some kind of default settings, might be overridden in ::init
StartMenuScreen::StartMenuScreen()
{
}

StartMenuScreen::~StartMenuScreen()
{
	delete bHost;
	delete bJoin;
	delete bOptions;
	delete bQuit;
}

void StartMenuScreen::init()
{
	if (minecraft->options.getIntValue(OPTIONS_MENU_STYLE) == 2){
bHost = new Button(    2, 0, 0, 200, 20, "เข้าสู่การผจญภัย");
			bJoin = new Button(    3, 0, 0, 200, 20, "เล่นกับผู้คน");
			bOptions = new Button( 4, 0, 0, 200, 20, "ตั้งค่าเกม");
			bQuit = new Button( 5, 0, 0, 200, 20, "ออกจากเกม");
	} else {
bHost = new Button(    2, 0, 0, 160, 24, "เข้าสู่การผจญภัย");
			bJoin = new Button(    3, 0, 0, 160, 24, "เล่นกับผู้คน");
			bOptions = new Button( 4, 0, 0, 160, 24, "ตั้งค่าเกม");
			bQuit = new Button( 5, 0, 0, 160, 24, "ออกจากเกม");
	}
	bJoin->active = bHost->active = bOptions->active = true;

	if (minecraft->options.getStringValue(OPTIONS_USERNAME).empty()) {
		return; // tick() will redirect to UsernameScreen
	}

	buttons.push_back(bHost);
	buttons.push_back(bJoin);
	//buttons.push_back(&bTest);
	buttons.push_back(bQuit);

	tabButtons.push_back(bHost);
	tabButtons.push_back(bJoin);
	tabButtons.push_back(bQuit);

	#ifndef RPI
		buttons.push_back(bOptions);
		tabButtons.push_back(bOptions);
	#endif

    //// add quit button (top right X icon) – match OptionsScreen style
    //{
    //    ImageDef def;
    //    def.name = "gui/touchgui.png";
    //    def.width = 34;
    //    def.height = 26;
    //    def.setSrc(IntRectangle(150, 0, (int)def.width, (int)def.height));
    //    bQuit.setImageDef(def, true);
    //    bQuit.scaleWhenPressed = false;
    //    buttons.push_back(&bQuit);
    //    // don't include in tab navigation
    //}

	copyright = "A Survival";

	// always show base version string, suffix was previously added for Android builds
	std::string versionString = Common::getGameVersionString();

	std::string _username = minecraft->options.getStringValue(OPTIONS_USERNAME);
	if (_username.empty()) _username = "unknown";

	username = "นักผจญภัย: " + _username;

	#ifdef DEMO_MODE
	#ifdef __APPLE__
		version = versionString + " (Lite)";
	#else
		version = versionString + " (Demo)";
	#endif
	#else
		#ifdef RPI
			version = "v0.1.1 alpha";//(MCPE " + versionString + " compatible)";
		#else
			version = versionString;
		#endif
	#endif
}

void StartMenuScreen::setupPositions() {
	if (minecraft->options.getIntValue(OPTIONS_MENU_STYLE) == 2){
		int yBase = (height / 2) - 20;

		bHost->y =	 yBase;
		bJoin->y =	 bHost->y + 24;
		bOptions->y = bJoin->y + 24;
		bQuit->y = bOptions->y + 24;
	} else {
		int yBase = height / 2;
		bHost->y =	 yBase;
		bJoin->y =	 bHost->y + 24 + 4;
		bOptions->y = bJoin->y + 24 + 4;
		bQuit->y = bOptions->y + 24 + 4;
	}

	// Center buttons
	bHost->x = (width - bHost->width) / 2;
	bJoin->x = (width - bJoin->width) / 2;
	bOptions->x = (width - bOptions->width) / 2;
	bQuit->x = (width - bQuit->width) / 2;

    //// position quit icon at top-right (use image-defined size)
    //bQuit.x = width - bQuit.width;
    //bQuit.y = 0;
}

void StartMenuScreen::tick() {
}

void StartMenuScreen::buttonClicked(Button* button) {

	if (button->id == bHost->id)
	{
        #if defined(DEMO_MODE) || defined(APPLE_DEMO_PROMOTION)
			minecraft->setScreen( new SimpleChooseLevelScreen("_DemoLevel") );
		#else
			minecraft->screenChooser.setScreen(SCREEN_SELECTWORLD);
		#endif
	}
	if (button->id == bJoin->id)
	{
		minecraft->locateMultiplayer();
		minecraft->screenChooser.setScreen(SCREEN_JOINGAME);
	}
	if (button->id == bOptions->id)
	{
		minecraft->setScreen(new OptionsScreen());
	}
	if (button->id == bQuit->id)
	{
		minecraft->quit();
	}
}

bool StartMenuScreen::isInGameScreen() { return false; }

void StartMenuScreen::renderCharacterPreview(float x0, float y0, float scale)
{
	if (!minecraft || !minecraft->player)
		return;

	glPushMatrix();
	glTranslatef(x0, y0, -200);
	glScalef(-scale, scale, scale);
	glRotatef(180, 0, 0, 1);

	Player* player = (Player*)minecraft->player;
	float oldBodyRot = player->yBodyRot;
	float oldRot = player->yRot;
	float oldPitch = player->xRot;
	float oldWalkPos = player->walkAnimPos;
	float oldWalkSpeed = player->walkAnimSpeed;
	float oldWalkSpeedO = player->walkAnimSpeedO;

	float t = getTimeS();
	player->yBodyRot = 8.0f * Mth::sin(t * 0.7f);
	player->yRot = player->yBodyRot * 2.0f;
	player->xRot = -2.0f;
	player->walkAnimSpeedO = player->walkAnimSpeed = 0.12f;
	player->walkAnimPos = t * player->walkAnimSpeed * SharedConstants::TicksPerSecond;

	EntityRenderDispatcher* dispatcher = EntityRenderDispatcher::getInstance();
	dispatcher->playerRotY = 180;
	dispatcher->render(player, 0, 0, 0, 0, 1);

	player->yBodyRot = oldBodyRot;
	player->yRot = oldRot;
	player->xRot = oldPitch;
	player->walkAnimPos = oldWalkPos;
	player->walkAnimSpeed = oldWalkSpeed;
	player->walkAnimSpeedO = oldWalkSpeedO;
	glPopMatrix();
}

void StartMenuScreen::render( int xm, int ym, float a )
{
	renderBackground();

		// Character-first lobby: the live player entity supplies skin, armor and held item.
	fill(0, 0, width, height, 0xff10182a);
	fill(0, 0, width, 24, 0xff182744);
	drawString(font, "A SURVIVAL", 12, 6, 0xffffd36a);
	drawString(font, username, width - font->width(username) - 12, 6, 0xffd9e6ff);

	const int panelLeft = width / 2 - 118;
	const int panelRight = width / 2 + 118;
	fill(panelLeft, 32, panelRight, height - 34, 0xff16233b);
	fill(panelLeft + 3, 35, panelRight - 3, height - 37, 0xff0d1526);
	drawString(font, "ตัวละครของคุณ", panelLeft + 12, 46, 0xffffffff);
	drawString(font, "อุปกรณ์ปัจจุบันจะติดตัวไปทุกโลก", panelLeft + 12, 58, 0xff9fb6d9);
	if (minecraft->player)
		renderCharacterPreview((float)width / 2.0f, (float)height * 0.72f, 45.0f);
	else
		drawString(font, "กำลังเตรียมตัวละคร...", width / 2 - 48, height / 2, 0xff9fb6d9);

	drawString(font, "แผนที่และเรื่องราว", 12, height - 27, 0xffffd36a);
	drawString(font, version, width - font->width(version) - 12, height - 27, 0xff8fa5c4);

	Screen::render(xm, ym, a);

}

void StartMenuScreen::mouseClicked(int x, int y, int buttonNum) {
	Screen::mouseClicked(x, y, buttonNum);
}

bool StartMenuScreen::handleBackEvent( bool isDown ) {
	minecraft->quit();
	return true;
}
