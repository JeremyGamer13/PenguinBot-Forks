const env = require("./env-util");

class RVCModels {
    /** Users are intended to be able to use this freely. Use for models trained on open voices like TTS models & such. @enum */
    static USAGE_FREE = 0;
    /** Users need approval to use this model. Use if you want to make voice models of your own voice but want others to play with it. @enum */
    static USAGE_APPROVAL = 1;
    /** Model is only usable in personal mode. Use if you want to make voice models of your own voice but dont want others to play with it. @enum */
    static USAGE_PERSONAL = 2;

    // NOTE: Generally `model` is a `.pth` file and `index` is the `.index` file that goes along with the `.pth` file
    // NOTE: Add these to getModelNames or they wont appear in listings. DO NOT USE THE `name` property, use the property name (the thing after `static`)
    static Jeremy = {
        name: "Jeremy",
        model: "F:/Software/ApplioV3.6.2/logs/jeremy-v1/jeremy-v1_8e_5864s.pth",
        index: "F:/Software/ApplioV3.6.2/logs/jeremy-v1/jeremy-v1.index",
        usage: this.USAGE_APPROVAL,
    };
    static BonziBUDDY = {
        name: "BonziBUDDY",
        model: "F:/Software/ApplioV3.6.2/logs/bonzibuddy-v1/bonzibuddy-v1_3e_2472s.pth",
        index: "F:/Software/ApplioV3.6.2/logs/bonzibuddy-v1/bonzibuddy-v1.index",
        usage: this.USAGE_FREE,
    };
    static eSpeakNG = {
        name: "eSpeak NG",
        model: "F:/Software/ApplioV3.6.2/logs/espeak-ng-v1/espeak-ng-v1_1e_962s.pth",
        index: "F:/Software/ApplioV3.6.2/logs/espeak-ng-v1/espeak-ng-v1.index",
        usage: this.USAGE_FREE,
    };

    // NOTE: Use the RVCModels property name, NOT the model.name!!
    static getModelNames() {
        return [
            "Jeremy",
            "BonziBUDDY",
            "eSpeakNG",
        ];
    }

    static default = this.Jeremy;
}

module.exports = RVCModels;