package io.framemind.modules.scriptmind.dto;

import java.util.List;

public record DiffResponse(
        int fromVersion,
        int toVersion,
        DiffData diff
) {
    public record DiffData(
            List<EpisodeDiff> episodesAdded,
            List<EpisodeDiff> episodesRemoved,
            List<EpisodeDiff> episodesModified
    ) {
    }

    public record EpisodeDiff(
            int episodeNumber,
            List<SceneDiff> scenesModified
    ) {
    }

    public record SceneDiff(
            String sceneId,
            List<BeatDiff> beatsAdded,
            List<BeatDiff> beatsRemoved,
            List<BeatDiff> beatsModified
    ) {
    }

    public record BeatDiff(
            String beatId,
            String field,
            String oldValue,
            String newValue
    ) {
    }
}
