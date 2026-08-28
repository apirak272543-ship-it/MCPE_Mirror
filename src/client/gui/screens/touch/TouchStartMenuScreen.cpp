#include "TouchStartMenuScreen.h"
#include "../ProgressScreen.h"
#include "../../../player/LocalPlayer.h"
#include "../../../renderer/entity/EntityRenderDispatcher.h"

#include "../OptionsScreen.h"
#include "../PauseScreen.h"

#include "../../Font.h"
#include "../../components/ScrolledSelectionList.h"
#include "../../components/GuiElement.h"

#include "../../../Minecraft.h"
#include "../../../renderer/Tesselator.h"
#include "../../../renderer/Textures.h"
#include "../../../renderer/TextureData.h"
#include "../../../../SharedConstants.h"
#include "../../../../AppPlatform.h"
#include "../../../../LicenseCodes.h"
#include "../../../../util/Mth.h"

#include "../DialogDefinitions.h"
#include "../SimpleChooseLevelScreen.h"

namespace Touch {

//
// Start menu screen implementation
//

// Some kind of default settings, might be overridden in ::init
StartMenuScreen::StartMenuScreen()
:	bHost(    2, "เข้าสู่การผจญภัย"),
	bJoin(    3, "เล่นกับผู้คน"),
	bOptions( 4, "ตั้งค่าเกม"),
	bQuit(    5, "")
{
	ImageDef def;
	bJoin.width = 75;
	def.width = def.height = (float) bJoin.width;

	def.setSrc(IntRectangle(0, 26, (int)def.width, (int)def.width));
	def.name = "gui/touchgui.png";
	IntRectangle& defSrc = *def.getSrc();

	bOptions.setImageDef(def, true);

	defSrc.y += defSrc.h;
	bHost.setImageDef(def, true);

	defSrc.y += defSrc.h;
	bJoin.setImageDef(def, true);
}

StartMenuScreen::~StartMenuScreen()
{
}

void StartMenuScreen::init()
{
	buttons.push_back(&bHost);
	buttons.push_back(&bJoin);
	buttons.push_back(&bOptions);

	// add quit icon (same look as options header)
	{
		ImageDef def;
		def.name = "gui/touchgui.png";
		def.width = 34;
		def.height = 26;
		def.setSrc(IntRectangle(150, 0, (int)def.width, (int)def.height));
		bQuit.setImageDef(def, true);
		bQuit.scaleWhenPressed = false;
		buttons.push_back(&bQuit);
	}

	tabButtons.push_back(&bHost);
	tabButtons.push_back(&bJoin);
	tabButtons.push_back(&bOptions);

	#ifdef DEMO_MODE
		buttons.push_back(&bBuy);
		tabButtons.push_back(&bBuy);
	#endif

	copyright = "A Survival";

	// always show base version string
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
		version = versionString;
	#endif

    #ifdef APPLE_DEMO_PROMOTION
        version = versionString + " (Demo)";
    #endif

	bJoin.active = bHost.active = bOptions.active = true;
}

void StartMenuScreen::setupPositions() {
	int yBase = 2 + height / 3;
	int buttonWidth = bHost.width;
	float spacing = (width - (3.0f * buttonWidth)) / 4;

	//#ifdef ANDROID
	bHost.y =	 yBase;
	bJoin.y =	 yBase;
	bOptions.y = yBase;
	//#endif

	// Center buttons
	bJoin.x		= 0*buttonWidth + (int)(1*spacing);
	bHost.x		= 1*buttonWidth + (int)(2*spacing);
	bOptions.x	= 2*buttonWidth + (int)(3*spacing);

	// quit icon top-right (use size assigned in init)
	bQuit.x = width - bQuit.width;
	bQuit.y = 0;

	copyrightPosX = width - minecraft->font->width(copyright) - 1;
	versionPosX = (width - minecraft->font->width(version)) / 2;// - minecraft->font->width(version) - 2;
}

void StartMenuScreen::buttonClicked(::Button* button) {

	if (button->id == bHost.id)
	{
		#if defined(DEMO_MODE) || defined(APPLE_DEMO_PROMOTION)
			minecraft->setScreen( new SimpleChooseLevelScreen("_DemoLevel") );
		#else
			minecraft->screenChooser.setScreen(SCREEN_SELECTWORLD);
		#endif
	}
	if (button->id == bJoin.id)
	{
        #ifdef APPLE_DEMO_PROMOTION
            minecraft->platform()->createUserInput(DialogDefinitions::DIALOG_DEMO_FEATURE_DISABLED);
        #else
            minecraft->locateMultiplayer();
            minecraft->screenChooser.setScreen(SCREEN_JOINGAME);
        #endif
	}
	if (button->id == bOptions.id)
	{
		minecraft->setScreen(new OptionsScreen());
	}
	if (button == &bQuit)
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

		// Character-first lobby. The live entity supplies its existing skin, armor and held item.
	fill(0, 0, width, height, 0xff10182a);
	fill(0, 0, width, 26, 0xff182744);
	drawString(font, "A SURVIVAL", 12, 7, 0xffffd36a);
	drawString(font, username, width - font->width(username) - 12, 7, 0xffd9e6ff);

	const int panelLeft = width / 2 - 132;
	const int panelRight = width / 2 + 132;
	fill(panelLeft, 34, panelRight, height - 42, 0xff16233b);
	fill(panelLeft + 3, 37, panelRight - 3, height - 45, 0xff0d1526);
	drawString(font, "ตัวละครของคุณ", panelLeft + 12, 49, 0xffffffff);
	drawString(font, "ชุดและไอเทมจะติดตัวไปทุกโลก", panelLeft + 12, 62, 0xff9fb6d9);
	if (minecraft->player)
		renderCharacterPreview((float)width / 2.0f, (float)height * 0.72f, 48.0f);
	else
		drawString(font, "กำลังเตรียมตัวละคร...", width / 2 - 52, height / 2, 0xff9fb6d9);

	drawString(font, "แผนที่และเรื่องราว", 12, height - 30, 0xffffd36a);
	drawString(font, version, width - font->width(version) - 12, height - 30, 0xff8fa5c4);
	Screen::render(xm, ym, a);

}


void StartMenuScreen::mouseClicked(int x, int y, int buttonNum) {
	Screen::mouseClicked(x, y, buttonNum);
}

bool StartMenuScreen::handleBackEvent( bool isDown ) {
	minecraft->quit();
	return true;
}

} // namespace Touch

